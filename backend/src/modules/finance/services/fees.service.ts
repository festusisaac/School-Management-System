import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Brackets } from 'typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { Transaction, TransactionType, PaymentMethod } from '../entities/transaction.entity';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { FeeStructure } from '../entities/fee-structure.entity';
import { CreateStructureDto } from '../dtos/create-structure.dto';
import { Discount } from '../entities/discount.entity';
import { CreateDiscountDto } from '../dtos/create-discount.dto';
import { PaymentReminder, ReminderChannel, ReminderStatus } from '../entities/payment-reminder.entity';
import { CreateReminderDto } from '../dtos/create-reminder.dto';
import { BulkReminderDto } from '../dtos/bulk-reminder.dto';
import { CarryForward } from '../entities/carry-forward.entity';
import { CarryForwardDto } from '../dtos/carry-forward.dto';
import { Student } from '../../students/entities/student.entity';
import { FeeHead } from '../entities/fee-head.entity';
import { FeeGroup } from '../entities/fee-group.entity';
import { CreateFeeHeadDto } from '../dtos/create-fee-head.dto';
import { CreateFeeGroupDto } from '../dtos/create-fee-group.dto';
import { DiscountProfile } from '../entities/discount-profile.entity';
import { DiscountRule } from '../entities/discount-rule.entity';
import { CreateDiscountProfileDto } from '../dtos/create-discount-profile.dto';
import { FeeAssignment } from '../entities/fee-assignment.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
import { AcademicSession } from '../../system/entities/academic-session.entity';

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Parent } from '../../students/entities/parent.entity';

@Injectable()
export class FeesService {
  constructor(
    @InjectQueue('finance') private readonly financeQueue: Queue,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(FeeStructure)
    private readonly structureRepo: Repository<FeeStructure>,
    @InjectRepository(Discount)
    private readonly discountRepo: Repository<Discount>,
    @InjectRepository(PaymentReminder)
    private readonly reminderRepo: Repository<PaymentReminder>,
    @InjectRepository(CarryForward)
    private readonly carryRepo: Repository<CarryForward>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(FeeHead)
    private readonly headRepo: Repository<FeeHead>,
    @InjectRepository(FeeGroup)
    private readonly groupRepo: Repository<FeeGroup>,
    @InjectRepository(FeeAssignment)
    private readonly assignmentRepo: Repository<FeeAssignment>,
    @InjectRepository(DiscountProfile)
    private readonly discountProfileRepo: Repository<DiscountProfile>,
    @InjectRepository(DiscountRule)
    private readonly discountRuleRepo: Repository<DiscountRule>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly systemSettingsService: SystemSettingsService,
    @InjectRepository(AcademicSession)
    private readonly sessionRepo: Repository<AcademicSession>,
  ) { }

  // Record an offline/payment
  async recordPayment(dto: CreatePaymentDto, tenantId: string) {
    return this.transactionRepo.manager.transaction(async (manager) => {
      const paymentAmount = parseFloat(dto.amount);
      if (paymentAmount <= 0) throw new BadRequestException('Payment amount must be greater than zero.');

      // Tenancy Validation
      const student = await manager.findOne(Student, { 
          where: { id: dto.studentId, tenantId },
          relations: ['class']
      });
      if (!student) throw new NotFoundException('Student not found in this school context.');

      // Duplicate check for references (Inside Transaction)
      if (dto.reference) {
        const existing = await manager.findOne(Transaction, {
          where: { reference: dto.reference, tenantId }
        });
        if (existing) throw new ConflictException(`Transaction with reference '${dto.reference}' already recorded.`);
      }

      const transactions: Transaction[] = [];
      const allocations = dto.meta?.allocations || [];
      let allocatedSum = 0;

      const sessionId = await this.systemSettingsService.getActiveSessionId();

      // 1. If allocations are provided, split the transaction
      if (Array.isArray(allocations) && allocations.length > 0) {
        for (const alloc of allocations) {
          const allocAmount = parseFloat(alloc.amount);
          if (allocAmount > 0) {
            allocatedSum += allocAmount;
            const tx = manager.create(Transaction, {
              amount: alloc.amount.toString(),
              studentId: dto.studentId,
              tenantId,
              sessionId: sessionId || undefined,
              reference: dto.reference || null,
              paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
              type: dto.type || TransactionType.FEE_PAYMENT,
              schoolSectionId: student.class?.schoolSectionId,
              meta: {
                ...dto.meta,
                allocations: [alloc],
                isSplitTransaction: true
              }
            });
            transactions.push(tx);
          }
        }

        if (Math.abs(paymentAmount - allocatedSum) > 0.01) {
          throw new BadRequestException(`Payment amount (${paymentAmount.toFixed(2)}) must be fully allocated. Unallocated: ${(paymentAmount - allocatedSum).toFixed(2)}`);
        }
      }

      // 2. Default single transaction
      if (transactions.length === 0) {
        const tx = manager.create(Transaction, {
          amount: dto.amount,
          studentId: dto.studentId,
          tenantId,
          sessionId: sessionId || undefined,
          reference: dto.reference || null,
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          type: dto.type || TransactionType.FEE_PAYMENT,
          schoolSectionId: student.class?.schoolSectionId,
          meta: dto.meta || {}
        });
        transactions.push(tx);
      }

      const saved = await manager.save(transactions);

      // Notifications (External to the atomic block)
      if (dto.type === TransactionType.FEE_PAYMENT || !dto.type) {
        this.sendPaymentNotifications(
          dto.studentId,
          tenantId,
          dto.amount,
          dto.reference || 'N/A',
          dto.paymentMethod || PaymentMethod.CASH,
          dto.meta
        ).catch(err => console.error('Notification error:', err));
      }

      return saved;
    });
  }

  private async sendPaymentNotifications(studentId: string, tenantId: string, amount: string, reference: string, method: string, meta: any) {
    try {
      const settings = await this.systemSettingsService.getSettings();
      const symbol = settings.currencySymbol || '₦';

      const student = await this.studentRepo.findOne({ where: { id: studentId, tenantId } });
      if (!student) return;

      const studentName = `${student.firstName} ${student.lastName || ''}`.trim();
      const date = new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });
      const allocations = meta?.allocations || [];

      // Determine detailed display method for online payments
      let displayMethod = method.replace(/_/g, ' ');
      if (method === PaymentMethod.ONLINE) {
        if (meta?.paystackData?.channel) {
          const channel = meta.paystackData.channel;
          displayMethod = `Online (${channel.charAt(0).toUpperCase() + channel.slice(1)})`;
        } else if (meta?.flutterwaveData?.payment_type) {
          const type = meta.flutterwaveData.payment_type;
          displayMethod = `Online (${type.charAt(0).toUpperCase() + type.slice(1)})`;
        }
      }

      // Email
      const targetEmail = student.email || student.guardianEmail;
      if (targetEmail) {
        await this.emailService.sendPaymentReceiptEmail(
          targetEmail,
          studentName,
          `${symbol}${parseFloat(amount).toLocaleString()}`,
          reference,
          date,
          displayMethod,
          allocations.map((a: any) => ({
             name: a.name,
             amount: `${symbol}${parseFloat(a.amount).toLocaleString()}`
          }))
        );
      }

      // SMS
      const targetPhone = student.mobileNumber || student.guardianPhone || student.fatherPhone || student.motherPhone;
      if (targetPhone) {
        await this.smsService.sendPaymentReceiptSms(
          targetPhone,
          studentName,
          `${symbol}${parseFloat(amount).toLocaleString()}`,
          reference
        );
      }
    } catch (error) {
      // Log error but don't rethrow
      console.error('Failed to send payment notifications:', error);
    }
  }

  async getStudentStatement(studentId: string, tenantId: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
    
    // If not a UUID, we can't find by ID/UserID directly as UUID columns. 
    // This handles the "me" case or other non-UUID slugs gracefully.
    if (!isUUID) {
      throw new NotFoundException('Invalid Student Identifier');
    }

    const student = await this.studentRepo.findOne({
      where: [{ id: studentId, tenantId }, { userId: studentId, tenantId }],
      relations: ['class'],
    });

    if (!student) throw new NotFoundException('Student not found');
    
    // Always use the primary Student ID for all queries
    const resolvedStudentId = student.id;

    const sessionId = await this.systemSettingsService.getActiveSessionId();

    // 1. Get all FEE_PAYMENT and REFUND transactions for student in current session
    //    Exclude CARRY_FORWARD entries — those are accounting transfers, not actual payments.
    const txWhere: any = { studentId: resolvedStudentId, tenantId };
    if (sessionId) txWhere.sessionId = sessionId;

    const allTransactions = await this.transactionRepo.find({
      where: txWhere,
      order: { createdAt: 'DESC' },
    });

    // Separate actual payments from carry-forward audit entries.
    // CARRY_FORWARD transactions are accounting transfers (debt moved sessions), not real payments.
    const transactions = allTransactions.filter(tx =>
      tx.type !== TransactionType.CARRY_FORWARD
    );

    // 2. Get Discount Profile
    let discountProfile = null;
    if (student.discountProfileId) {
      discountProfile = await this.discountProfileRepo.findOne({
        where: { id: student.discountProfileId, isActive: true, tenantId },
        relations: ['rules']
      });

      // Check for expiry
      if (discountProfile && discountProfile.expiryDate && new Date() > new Date(discountProfile.expiryDate)) {
        discountProfile = null;
      }
    }

    // 2. Carry Forwards (Opening Balances)
    const cfWhere: any = { studentId: resolvedStudentId, tenantId };
    
    // Resolve session name for fallback if needed
    let sessionName = null;
    if (sessionId) {
      const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
      if (session) sessionName = session.name;
    }

    const carryForwards = await this.carryRepo.find({
      where: sessionId ? [
        { ...cfWhere, sessionId },
        { ...cfWhere, sessionId: IsNull(), academicYear: sessionName }
      ] : cfWhere,
      relations: ['feeHead']
    });

    // 4. Get Assignments & Calculate Dues for current session
    const asWhere: any = { studentId: resolvedStudentId, isActive: true, tenantId };
    if (sessionId) asWhere.sessionId = sessionId;

    const assignments = await this.assignmentRepo.find({
      where: asWhere,
      relations: ['feeGroup', 'feeGroup.heads'],
    });

    // Map to track payments per head
    const paidByHead: Record<string, number> = {};
    transactions.forEach(tx => {
      const txAllocations = tx.meta?.allocations || [];
      if (Array.isArray(txAllocations)) {
        txAllocations.forEach((a: any) => {
          if (a.id) {
            paidByHead[a.id] = (paidByHead[a.id] || 0) + parseFloat(a.amount || '0');
          }
        });
      }
    });

    const assignedHeads = assignments.flatMap(a => {
      const excludedIds = a.excludedHeadIds || [];
      return (a.feeGroup?.heads || [])
        .filter(h => !excludedIds.includes(h.id)) // Filter out excluded heads
        .map(h => {
          const totalAmount = parseFloat(h.defaultAmount || '0');
          const paidAmount = paidByHead[h.id] || 0;
          return {
            id: h.id,
            name: h.name,
            amount: h.defaultAmount, // Original total amount
            paid: paidAmount.toFixed(2),
            balance: (totalAmount - paidAmount).toFixed(2),
            group: a.feeGroup?.name
          };
        });
    });

    const totalCarryForward = carryForwards.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    const totalDue = assignedHeads.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0) + totalCarryForward;
    const totalPaid = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    const balance = totalDue - totalPaid;

    const labeledCarryForwards = carryForwards.map(cf => {
      const totalAmount = parseFloat(cf.amount || '0');
      const paidAmount = paidByHead[cf.id] || 0;
      const headName = cf.feeHead?.name;
      return {
        ...cf,
        name: headName ? `Arrears: ${headName} (${cf.academicYear})` : `Balance Brought Forward (${cf.academicYear})`,
        amount: totalAmount.toFixed(2),
        paid: paidAmount.toFixed(2),
        balance: (totalAmount - paidAmount).toFixed(2),
        type: 'CARRY_FORWARD'
      };
    });

    return {
      student,
      totalDue: totalDue.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      balance: balance.toFixed(2),
      discountApplied: discountProfile?.name || null,
      assignedHeads,
      carryForwards: labeledCarryForwards,
      transactions,
    };
  }

  // Lightweight balance check for a student in the current session
  async getStudentCurrentBalance(studentId: string, tenantId: string): Promise<number> {
    const sessionId = await this.systemSettingsService.getActiveSessionId();
    
    // 1. Transactions
    const txWhere: any = { studentId, tenantId };
    if (sessionId) txWhere.sessionId = sessionId;
    const transactions = await this.transactionRepo.find({ where: txWhere });

    // 2. Carry Forwards
    const cfWhere: any = { studentId, tenantId };
    
    let sessionName = null;
    if (sessionId) {
      const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
      if (session) sessionName = session.name;
    }

    const carryForwards = await this.carryRepo.find({
      where: sessionId ? [
        { ...cfWhere, sessionId },
        { ...cfWhere, sessionId: IsNull(), academicYear: sessionName }
      ] : cfWhere,
    });

    // 3. Assignments
    const asWhere: any = { studentId, isActive: true, tenantId };
    if (sessionId) asWhere.sessionId = sessionId;
    const assignments = await this.assignmentRepo.find({
      where: asWhere,
      relations: ['feeGroup', 'feeGroup.heads'],
    });

    // 4. Sum up
    const totalPaid = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    const totalCarryForward = carryForwards.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    
    const assignedHeads = assignments.flatMap(a => {
      const excludedIds = a.excludedHeadIds || [];
      return (a.feeGroup?.heads || []).filter(h => !excludedIds.includes(h.id));
    });
    const totalDue = assignedHeads.reduce((acc, curr) => acc + parseFloat(curr.defaultAmount || '0'), 0) + totalCarryForward;

    return totalDue - totalPaid;
  }

  // New helper to get unpaid heads for a student in a session
  async getStudentUnpaidHeads(studentId: string, sessionId: string, tenantId: string) {
    // 1. Transactions for that session
    const transactions = await this.transactionRepo.find({
        where: { studentId, sessionId, tenantId },
    });

    // 2. Assignments for that session
    const assignments = await this.assignmentRepo.find({
        where: { studentId, sessionId, tenantId },
        relations: ['feeGroup', 'feeGroup.heads'],
    });

    // 3. Carry Forwards for that session
    const carryForwards = await this.carryRepo.find({
        where: { studentId, sessionId, tenantId },
    });

    const paidByHead: Record<string, number> = {};
    transactions.forEach(tx => {
        const txAllocations = tx.meta?.allocations || [];
        if (Array.isArray(txAllocations)) {
            txAllocations.forEach((a: any) => {
                if (a.id) paidByHead[a.id] = (paidByHead[a.id] || 0) + parseFloat(a.amount || '0');
            });
        }
    });

    // Sum of previous carry-forwards (treated as "Opening Balances")
    const cfByHead: Record<string, number> = {};
    carryForwards.forEach(cf => {
        if (cf.feeHeadId) {
            cfByHead[cf.feeHeadId] = (cfByHead[cf.feeHeadId] || 0) + parseFloat(cf.amount || '0');
        }
    });

    const results: any[] = [];
    const processedHeadIds = new Set<string>();

    // Process Assignments
    assignments.forEach(a => {
        const excludedIds = a.excludedHeadIds || [];
        const heads = a.feeGroup?.heads || [];
        heads.filter(h => !excludedIds.includes(h.id)).forEach(h => {
            const headDue = parseFloat(h.defaultAmount || '0');
            const headPaid = paidByHead[h.id] || 0;
            const headCf = cfByHead[h.id] || 0;
            const headBalance = (headDue + headCf) - headPaid;
            
            if (headBalance > 0) {
                results.push({
                    id: h.id,
                    name: h.name,
                    amount: headBalance.toFixed(2),
                    originalDue: headDue,
                    totalBilled: (headDue + headCf).toFixed(2)
                });
            }
            processedHeadIds.add(h.id);
        });
    });

    // Process leftover Carry Forwards (if any heads were carried forward but not assigned this session)
    carryForwards.forEach(cf => {
        if (cf.feeHeadId && !processedHeadIds.has(cf.feeHeadId)) {
            const headCf = parseFloat(cf.amount || '0');
            const headPaid = paidByHead[cf.feeHeadId] || 0;
            const headBalance = headCf - headPaid;
            if (headBalance > 0) {
                results.push({
                    id: cf.feeHeadId,
                    name: cf.feeHead?.name || 'Previous Balance',
                    amount: headBalance.toFixed(2),
                    originalDue: 0,
                    totalBilled: headCf.toFixed(2)
                });
            }
        }
    });

    return results;
  }

  // Start a bulk carry forward job
  async startBulkCarryForward(options: any, tenantId: string) {
    const job = await this.financeQueue.add('bulk-carry-forward', {
      ...options,
      tenantId
    });
    return { jobId: job.id };
  }

  // Original sync method (kept for internal use but modified for queue)
  async carryForwardAllBalances(options: { 
    oldSessionId?: string, 
    newSessionId?: string,
    oldSessionName?: string,
    newSessionName?: string 
  }, tenantId: string): Promise<any> {
    const sessionRepo = this.studentRepo.manager.getRepository('AcademicSession');
    
    let oldId = options.oldSessionId;
    let newId = options.newSessionId;

    // Resolve IDs from names if needed
    if (!oldId && options.oldSessionName) {
      const s = await sessionRepo.findOne({ where: { name: options.oldSessionName } });
      if (s) oldId = s.id;
    }
    if (!newId && options.newSessionName) {
      const s = await sessionRepo.findOne({ where: { name: options.newSessionName } });
      if (s) newId = s.id;
    }

    if (!oldId) throw new BadRequestException('Source session not found or specified.');
    if (!newId) throw new BadRequestException('Target session not found or specified.');

    const students = await this.studentRepo.find({ where: { isActive: true, tenantId } });
    const oldSession = await sessionRepo.findOne({ where: { id: oldId } });
    const academicYearLabel = oldSession ? oldSession.name : 'Previous Session';

    let processed = 0;
    let skipped = 0;
    let totalAmount = 0;

    for (const student of students) {
      const unpaidHeads = await this.getStudentUnpaidHeads(student.id, oldId as string, tenantId);
      
      if (unpaidHeads.length > 0) {
        for (const head of unpaidHeads) {
            // DUPLICATION CHECK: Prevent double billing for same head in same session
            const existing = await this.carryRepo.findOne({
                where: { 
                    studentId: student.id, 
                    feeHeadId: head.id, 
                    sessionId: newId as string,
                    tenantId 
                }
            });

            if (existing) continue;

            const carryEntry = this.carryRepo.create({
                studentId: student.id,
                amount: head.amount,
                academicYear: academicYearLabel,
                sessionId: newId as string,
                feeHeadId: head.id,
                tenantId,
                meta: { originalSessionId: oldId }
            });
            const savedCarry = await this.carryRepo.save(carryEntry);

            // AUDIT TRANSACTION: Record the carry-forward in the OLD session as CARRY_FORWARD type.
            // This is purely for audit trail — it is excluded from totalPaid in all statement calculations.
            const clearingTx = this.transactionRepo.create({
                amount: head.amount,
                studentId: student.id,
                tenantId,
                sessionId: oldId as string,
                type: TransactionType.CARRY_FORWARD,
                paymentMethod: PaymentMethod.CASH,
                reference: `CF-TO-${options.newSessionName || 'NEXT'}`,
                meta: {
                    isCarryForwardClearing: true,
                    targetSession: options.newSessionName,
                    carryForwardId: savedCarry.id,
                    feeHeadId: head.id,
                    narrative: `Bal. (${head.name}) Transferred to ${options.newSessionName || 'Next Session'}`,
                    allocations: [{ id: head.id, name: head.name, amount: head.amount }]
                }
            });
            await this.transactionRepo.save(clearingTx);

            // DEACTIVATE OLD FEE ASSIGNMENT: Clear the debt from the old session view.
            await this.assignmentRepo.createQueryBuilder()
                .update()
                .set({ isActive: false })
                .where('"studentId" = :sid AND "sessionId" = :sesId AND "tenantId" = :tid', {
                    sid: student.id, sesId: oldId, tid: tenantId
                })
                .execute();

            totalAmount += parseFloat(head.amount);
        }
        processed++;
      } else {
        skipped++;
      }
    }

    return {
      total: students.length,
      processed,
      skipped,
      totalAmount: totalAmount.toFixed(2)
    };
  }

  // History
  async paymentHistory(options: {
    studentId?: string; // This can now be a search term too
    startDate?: string;
    endDate?: string;
    method?: PaymentMethod;
    type?: TransactionType;
    sectionId?: string;
    page?: number;
    limit?: number;
  } = {}, tenantId: string) {
    const sessionId = await this.systemSettingsService.getActiveSessionId();
    const q = this.transactionRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.student', 'student')
      .leftJoinAndSelect('student.class', 'class')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC');
    
    if (sessionId) {
      q.andWhere('t.sessionId = :sessionId', { sessionId });
    }

    if (options.sectionId) {
      q.andWhere(new Brackets((qb: any) => {
        qb.where('t.schoolSectionId = :sectionId', { sectionId: options.sectionId })
          .orWhere(new Brackets((sqb: any) => {
            sqb.where('t.schoolSectionId IS NULL')
              .andWhere('class.schoolSectionId = :sectionId', { sectionId: options.sectionId });
          }));
      }));
    }

    if (options.studentId) {
      // Check if it looks like a UUID (exact ID match)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.studentId);

      if (isUUID) {
        // Find the student to get the real studentId (it might be a userId)
        const student = await this.studentRepo.findOne({
          where: [{ id: options.studentId }, { userId: options.studentId }]
        });
        
        const resolvedId = student ? student.id : options.studentId;
        q.andWhere('t.studentId = :studentId', { studentId: resolvedId });
      } else {
        // Fuzzy search on student details
        q.andWhere(
          '(student.firstName ILIKE :search OR student.lastName ILIKE :search OR student.admissionNo ILIKE :search)',
          { search: `%${options.studentId}%` }
        );
      }
    }

    if (options.startDate) {
      q.andWhere('t.createdAt >= :startDate', { startDate: new Date(options.startDate) });
    }

    if (options.endDate) {
      q.andWhere('t.createdAt <= :endDate', { endDate: new Date(options.endDate) });
    }

    if (options.method) {
      q.andWhere('t.paymentMethod = :method', { method: options.method });
    }

    if (options.type) {
      q.andWhere('t.type = :type', { type: options.type });
    }

    const page = options.page || 1;
    const limit = options.limit || 10;

    // Clone query for totals calculation before applying pagination
    const totalAmountQuery = q.clone();

    // Remove the default ordering when calculating sum to avoid "must appear in GROUP BY" error
    totalAmountQuery.orderBy();

    const stats = await totalAmountQuery
      .select('SUM(CASE WHEN t.type = :paymentType THEN t.amount::numeric ELSE 0 END)', 'paymentSum')
      .addSelect('SUM(CASE WHEN t.type = :refundType THEN t.amount::numeric ELSE 0 END)', 'refundSum')
      .addSelect('COUNT(CASE WHEN t.type = :paymentType THEN 1 END)', 'paymentCount')
      .addSelect('COUNT(CASE WHEN t.type = :refundType THEN 1 END)', 'refundCount')
      .addSelect('COUNT(CASE WHEN t.type = :waiverType THEN 1 END)', 'waiverCount')
      .addSelect(`COUNT(CASE WHEN (t.meta->'allocations')::jsonb @> '[{"status": "PARTIAL"}]'::jsonb THEN 1 END)`, 'partialCount')
      .setParameters({
        paymentType: TransactionType.FEE_PAYMENT,
        refundType: TransactionType.REFUND,
        waiverType: TransactionType.WAIVER,
      })
      .getRawOne();

    const totalAmount = parseFloat(stats.paymentSum || '0') + parseFloat(stats.refundSum || '0');

    q.skip((page - 1) * limit).take(limit);

    const [items, total] = await q.getManyAndCount();
    return {
      items,
      total,
      totalAmount,
      stats: {
        paymentCount: parseInt(stats.paymentCount || '0'),
        refundCount: parseInt(stats.refundCount || '0'),
        waiverCount: parseInt(stats.waiverCount || '0'),
        partialCount: parseInt(stats.partialCount || '0'),
      },
      page,
      limit
    };
  }

  // Refund / Reversal
  async refundTransaction(id: string, reason: string, tenantId: string) {
    return this.transactionRepo.manager.transaction(async (manager) => {
      // Use advisory lock to prevent concurrent refunds for the same transaction
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`REFUND-${id}`]);

      const originalTx = await manager.findOne(Transaction, {
        where: { id, tenantId },
        relations: ['student']
      });

      if (!originalTx) throw new NotFoundException('Transaction not found');
      if (originalTx.type === TransactionType.REFUND) throw new BadRequestException('Cannot refund a refund transaction');

      if (originalTx.meta?.isRefunded) {
        throw new BadRequestException('Transaction has already been refunded');
      }

      // Map allocations to negative amounts if they exist
      const originalAllocations = originalTx.meta?.allocations || [];
      const refundAllocations = Array.isArray(originalAllocations)
        ? originalAllocations.map((a: any) => ({
          ...a,
          amount: (-parseFloat(a.amount || '0')).toString(),
        }))
        : [];

      const refundTx = manager.create(Transaction, {
        amount: (-parseFloat(originalTx.amount)).toString(),
        studentId: originalTx.studentId as string,
        tenantId,
        type: TransactionType.REFUND,
        sessionId: originalTx.sessionId,
        schoolSectionId: originalTx.schoolSectionId,
        paymentMethod: originalTx.paymentMethod,
        reference: `REF-${originalTx.reference || originalTx.id.substring(0, 8)}`,
        meta: {
          ...originalTx.meta,
          allocations: refundAllocations.length > 0 ? refundAllocations : undefined,
          originalTransactionId: originalTx.id,
          reason,
          refundedAt: new Date().toISOString()
        }
      });

      await manager.save(refundTx);

      // Mark original transaction as refunded
      originalTx.meta = {
        ...originalTx.meta,
        isRefunded: true,
        refundTransactionId: refundTx.id
      };
      await manager.save(originalTx);

      return refundTx;
    });
  }

  // Simplified Batch Assignment for MVP
  // Updated Assignment to support exclusions
  async assignFeesToStudent(studentId: string, feeGroupIds: string[], tenantId: string, feeExclusions?: Record<string, string[]>) {
    const sessionId = await this.systemSettingsService.getActiveSessionId();
    
    // 1. Remove existing to allow clean overwrite
    // We only remove for the current session to avoid clearing past history
    await this.assignmentRepo.delete({ studentId, tenantId, sessionId: sessionId || IsNull() });

    // 2. Create new ones
    if (feeGroupIds.length > 0) {
      const sessionLabel = new Date().getFullYear().toString();
      const assignments = feeGroupIds.map(gid => this.assignmentRepo.create({
        studentId,
        feeGroupId: gid,
        tenantId,
        sessionId: sessionId || undefined,
        session: sessionLabel,
        excludedHeadIds: feeExclusions?.[gid] || null,
        isActive: true,
      }));
      await this.assignmentRepo.save(assignments);
    }
  }

  async getAssignmentsByStudent(studentId: string, tenantId: string) {
    return this.assignmentRepo.find({
      where: { studentId, isActive: true, tenantId }
    });
  }

  // Debtors (students with outstanding balance)
  async debtorsList(options: {
    classId?: string;
    search?: string;
    page?: number | string;
    limit?: number | string;
    minBalance?: number;
    riskLevel?: string;
    sectionId?: string;
  } = {}, tenantId: string) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 50);
    const { classId, search } = options;

    const query = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .where('student.isActive = :isActive AND student.tenantId = :tenantId', { isActive: true, tenantId });

    if (classId && classId !== 'all') {
      query.andWhere('student.classId = :classId', { classId });
    }

    if (search) {
      query.andWhere(
        '(student.firstName ILIKE :search OR student.lastName ILIKE :search OR student.admissionNo ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Performance optimization: only consider students with at least one active assignment
    query.andWhere(qb => {
      const subQuery = qb.subQuery()
        .select('1')
        .from('fee_assignments', 'fa')
        .where('fa.studentId = student.id')
        .andWhere('fa.tenantId = :tenantId')
        .andWhere('fa.isActive = :faActive');
      
      return `EXISTS (${subQuery.getQuery()})`;
    });

    const sessionId = await this.systemSettingsService.getActiveSessionId();
    if (sessionId) {
      query.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from('fee_assignments', 'fa2')
          .where('fa2.studentId = student.id')
          .andWhere('fa2.sessionId = :sessionId')
          .getQuery();
        return `EXISTS (${subQuery})`;
      });
      query.setParameter('sessionId', sessionId);
    }

    if (options.sectionId) {
      query.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from('classes', 'cls')
          .where('cls.id = student.classId')
          .andWhere('cls.schoolSectionId = :sectionId')
          .getQuery();
        return `EXISTS (${subQuery})`;
      });
      query.setParameter('sectionId', options.sectionId);
    }

    query.setParameters({ faActive: true, tenantId });

    const students = await query
      .orderBy('student.firstName', 'ASC')
      .getMany();

    // Calculate real statement for each student to find true debtors
    const allDebtors = await Promise.all(students.map(async (student) => {
      const statement = await this.getStudentStatement(student.id, tenantId);
      const balance = parseFloat(statement.balance.toString());

      // Filter out those who don't owe anything
      if (balance <= 0) return null;

      return {
        id: student.id,
        student,
        totalDue: statement.totalDue,
        totalPaid: statement.totalPaid,
        balance: statement.balance,
        discountApplied: statement.discountApplied
      };
    }));

    // Remove nulls (non-debtors)
    const filteredDebtors = allDebtors.filter((d): d is any => d !== null);

    const total = filteredDebtors.length;
    const startIndex = (page - 1) * limit;
    const items = filteredDebtors.slice(startIndex, startIndex + limit);

    // Calculate stats based on filtered debtors
    const totalOutstanding = filteredDebtors.reduce((acc, curr: any) => acc + parseFloat(curr.balance), 0);
    const totalPaidVal = filteredDebtors.reduce((acc, curr: any) => acc + parseFloat(curr.totalPaid), 0);
    const totalDueVal = filteredDebtors.reduce((acc, curr: any) => acc + parseFloat(curr.totalDue), 0);

    return {
      items,
      total,
      page,
      limit,
      stats: {
        totalOutstanding,
        debtorCount: total,
        totalPaid: totalPaidVal,
        totalDue: totalDueVal,
      }
    };
  }

  async getFamilyFinancials(studentId: string, tenantId: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
    if (!isUUID) throw new NotFoundException('Invalid Student Identifier');

    const student = await this.studentRepo.findOne({ 
      where: [{ id: studentId, tenantId }, { userId: studentId, tenantId }] 
    });
    if (!student) throw new NotFoundException('Student not found');

    let siblings: Student[] = [student];

    if (student.parentId) {
      siblings = await this.studentRepo.find({
        where: { parentId: student.parentId, isActive: true, tenantId },
        relations: ['class']
      });
    }

    const familyData = await Promise.all(siblings.map(async (sib) => {
      const statement = await this.getStudentStatement(sib.id, tenantId);
      return {
        ...statement,
        student: {
          ...statement.student,
          photo: (statement.student as any).studentPhoto?.replace(/\\/g, '/')
        }
      };
    }));

    const familyTotalDue = familyData.reduce((acc, curr) => acc + parseFloat(curr.totalDue), 0);
    const familyTotalPaid = familyData.reduce((acc, curr) => acc + parseFloat(curr.totalPaid), 0);
    const familyBalance = familyTotalDue - familyTotalPaid;

    return {
      familyTotalDue: familyTotalDue.toFixed(2),
      familyTotalPaid: familyTotalPaid.toFixed(2),
      familyBalance: familyBalance.toFixed(2),
      siblings: familyData,
      siblingCount: siblings.length
    };
  }



  async createHead(dto: any, tenantId: string) {
    const head = this.headRepo.create({ ...dto, tenantId });
    return this.headRepo.save(head);
  }

  async listHeads(tenantId: string) {
    return this.headRepo.find({ 
      where: { tenantId },
      order: { name: 'ASC' } 
    });
  }

  async deleteHead(id: string, tenantId: string) {
    return this.headRepo.delete({ id, tenantId });
  }

  async updateHead(id: string, dto: any, tenantId: string) {
    await this.headRepo.update({ id, tenantId }, dto);
    return this.headRepo.findOne({ where: { id, tenantId } });
  }

  // --- Fee Group Management ---
  async createGroup(dto: any, tenantId: string) {
    const { headIds, ...rest } = dto;
    const group: any = this.groupRepo.create({ ...rest, tenantId });

    if (headIds?.length > 0) {
      group.heads = await this.headRepo.find({
        where: headIds.map((id: string) => ({ id, tenantId }))
      });
    }

    return this.groupRepo.save(group);
  }

  async listGroups(tenantId: string) {
    return this.groupRepo.find({ 
      where: { tenantId },
      relations: ['heads'],
      order: { name: 'ASC' } 
    });
  }

  async deleteGroup(id: string, tenantId: string) {
    return this.groupRepo.delete({ id, tenantId });
  }

  async updateGroup(id: string, dto: any, tenantId: string) {
    const { headIds, ...rest } = dto;
    const group = await this.groupRepo.findOne({ 
      where: { id, tenantId }, 
      relations: ['heads'] 
    });
    if (!group) throw new NotFoundException('Group not found');

    Object.assign(group, rest);

    if (headIds) {
      group.heads = await this.headRepo.find({
        where: headIds.map((id: string) => ({ id, tenantId }))
      });
    }

    return this.groupRepo.save(group);
  }

  // --- Discount Management ---
  async createDiscountProfile(dto: any, tenantId: string) {
    const { rules, ...rest } = dto;
    const profile: any = this.discountProfileRepo.create({ ...rest, tenantId });
    await this.discountProfileRepo.save(profile);

    if (rules?.length > 0) {
      const savedRules = rules.map((r: any) => this.discountRuleRepo.create({
        ...r,
        profileId: profile.id,
        tenantId
      }));
      await this.discountRuleRepo.save(savedRules);
    }

    return this.getDiscountProfile(profile.id, tenantId);
  }

  async updateDiscountProfile(id: string, dto: any, tenantId: string) {
    const { rules, ...rest } = dto;
    await this.discountProfileRepo.update({ id, tenantId }, rest);

    if (rules) {
      await this.discountRuleRepo.delete({ profileId: id, tenantId });
      const savedRules = rules.map((r: any) => this.discountRuleRepo.create({
        ...r,
        profileId: id,
        tenantId
      }));
      await this.discountRuleRepo.save(savedRules);
    }

    return this.getDiscountProfile(id, tenantId);
  }

  async listDiscountProfiles(tenantId: string) {
    return this.discountProfileRepo.find({ 
      where: { tenantId },
      relations: ['rules', 'rules.feeHead'],
      order: { name: 'ASC' } 
    });
  }

  async getDiscountProfile(id: string, tenantId: string) {
    const profile = await this.discountProfileRepo.findOne({
      where: { id, tenantId },
      relations: ['rules', 'rules.feeHead']
    });
    if (!profile) throw new NotFoundException('Discount profile not found');
    return profile;
  }

  async deleteDiscountProfile(id: string, tenantId: string) {
    return this.discountProfileRepo.delete({ id, tenantId });
  }

  // Fee Structure
  async createStructure(dto: any, tenantId: string) {
    const structure = this.structureRepo.create({ ...dto, tenantId });
    return this.structureRepo.save(structure);
  }

  async listStructures(tenantId: string) {
    return this.structureRepo.find({ 
      where: { tenantId },
      order: { name: 'ASC' }
    });
  }

  // Discounts
  async createDiscount(dto: any, tenantId: string) {
    const discount = this.discountRepo.create({ ...dto, tenantId });
    return this.discountRepo.save(discount);
  }

  async listDiscounts(tenantId: string) {
    return this.discountRepo.find({ where: { tenantId } });
  }

  // Reminders
  async createReminder(dto: any, tenantId: string) {
    const reminder = this.reminderRepo.create({
      studentId: dto.studentId,
      dueDate: new Date(dto.dueDate),
      message: dto.message || null,
      status: ReminderStatus.PENDING,
      channel: ReminderChannel.EMAIL,
      tenantId
    } as any);
    return this.reminderRepo.save(reminder);
  }

  async sendBulkReminders(dto: any, tenantId: string) {
    const results: any[] = [];
    const failed: any[] = [];

    for (const studentId of dto.studentIds) {
      try {
        const statement = await this.getStudentStatement(studentId, tenantId);
        const student = statement.student as any;
        const balance = statement.balance;

        if (parseFloat(balance) <= 0) continue;

        const channel: ReminderChannel = dto.channel || ReminderChannel.EMAIL;
        const dueDate = dto.dueDate
          ? new Date(dto.dueDate).toLocaleDateString('en-GB', { dateStyle: 'long' })
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { dateStyle: 'long' });

        const studentName = `${student.firstName} ${student.lastName}`;
        const formattedBalance = `${balance}`;

        // --- Resolve contact targets ---
        const parentEmail = student.parent?.email || student.email;
        const parentPhone = student.fatherPhone || student.motherPhone || student.guardianPhone || student.mobileNumber;

        let emailSent = false;
        let smsSent = false;

        // --- Send Email ---
        if ((channel === ReminderChannel.EMAIL || channel === ReminderChannel.BOTH) && parentEmail) {
          emailSent = await this.emailService.sendPaymentReminderEmail(
            parentEmail,
            studentName,
            formattedBalance,
            dueDate,
            dto.messageTemplate || undefined,
          );
        }

        // --- Send SMS ---
        if ((channel === ReminderChannel.SMS || channel === ReminderChannel.BOTH) && parentPhone) {
          smsSent = await this.smsService.sendPaymentReminderSms(
            parentPhone,
            studentName,
            formattedBalance,
            dto.messageTemplate || undefined,
          );
        }

        const didSend = emailSent || smsSent;

        // --- Save reminder record ---
        const reminder = this.reminderRepo.create({
          studentId,
          amount: parseFloat(balance),
          dueDate: new Date(),
          message: dto.messageTemplate || null,
          channel,
          status: didSend ? ReminderStatus.SENT : ReminderStatus.FAILED,
          tenantId,
        } as any);

        await this.reminderRepo.save(reminder);
        results.push({ studentId, studentName, emailSent, smsSent });
      } catch (err: any) {
        failed.push({ studentId, error: err.message });
      }
    }

    return {
      total: dto.studentIds.length,
      processed: results.length,
      failed: failed.length,
      details: results,
      errors: failed,
    };
  }


  async listReminders(options: any = {}, tenantId: string) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20);

    const query = this.reminderRepo.createQueryBuilder('r')
      .leftJoinAndMapOne('r.student', Student, 'student', 'student.id = CAST(r.studentId AS UUID)')
      .where('r.tenantId = :tenantId', { tenantId })
      .orderBy('r.createdAt', 'DESC');


    if (options.studentId) {
      query.andWhere('r.studentId = :studentId', { studentId: options.studentId });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  // Carry forward
  async carryForward(dto: any, tenantId: string) {
    const sessionId = dto.oldSessionId || await this.systemSettingsService.getActiveSessionId();
    if (!sessionId) throw new BadRequestException('No source academic session found.');

    const unpaidHeads = await this.getStudentUnpaidHeads(dto.studentId, sessionId, tenantId);
    
    if (unpaidHeads.length === 0) {
      throw new BadRequestException('Student has no outstanding balance to carry forward.');
    }

    const processedCarryForwards: any[] = [];
    const totalAmount = unpaidHeads.reduce((acc, h) => acc + parseFloat(h.amount), 0);

    for (const head of unpaidHeads) {
        // Create individual head-level carry forward
        const c = this.carryRepo.create({ 
            studentId: dto.studentId,
            amount: head.amount,
            academicYear: dto.academicYear,
            sessionId: dto.sessionId, // Target Session
            feeHeadId: head.id,
            tenantId,
            meta: { originalSessionId: sessionId }
        });
        const saved = await this.carryRepo.save(c);
        processedCarryForwards.push(saved);

        // POST CLEARING TRANSACTION IN SOURCE SESSION (Per Head)
        const clearingTx = this.transactionRepo.create({
            amount: head.amount,
            studentId: dto.studentId,
            tenantId,
            sessionId: sessionId,
            type: TransactionType.ADJUSTMENT,
            paymentMethod: PaymentMethod.CASH,
            reference: `CF-TO-${dto.academicYear || 'NEXT'}`,
            meta: {
                isCarryForwardClearing: true,
                targetSession: dto.academicYear,
                carryForwardId: saved.id,
                feeHeadId: head.id,
                narrative: `Bal. (${head.name}) Transferred to ${dto.academicYear || 'Next Session'}`,
                allocations: [{ id: head.id, name: head.name, amount: head.amount }]
            }
        });
        await this.transactionRepo.save(clearingTx);
    }

    return { 
        studentId: dto.studentId, 
        totalAmount: totalAmount.toFixed(2), 
        count: processedCarryForwards.length 
    };
  }

  async listCarryForwards(options: any = {}, tenantId: string) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20);

    const query = this.carryRepo.createQueryBuilder('c')
      .leftJoinAndMapOne('c.student', Student, 'student', 'student.id = CAST(c.studentId AS UUID)')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('c.feeHead', 'feeHead')
      .where('c.tenantId = :tenantId', { tenantId })
      .orderBy('c.createdAt', 'DESC');

    if (options.studentId) {
      query.andWhere('c.studentId = :studentId', { studentId: options.studentId });
    }

    if (options.academicYear) {
      query.andWhere('c.academicYear = :academicYear', { academicYear: options.academicYear });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async deleteCarryForward(id: string, tenantId: string) {
    // 1. Find the carry forward to get metadata
    const cf = await this.carryRepo.findOne({ where: { id, tenantId } });
    if (cf) {
        // 2. Delete corresponding clearing transactions in any session for this carry forward
        // We look for transactions that have this carryForwardId in their meta
        const transactions = await this.transactionRepo.find({
            where: { studentId: cf.studentId, tenantId, type: TransactionType.ADJUSTMENT }
        });

        const toDelete = transactions.filter(tx => tx.meta?.carryForwardId === id);
        if (toDelete.length > 0) {
            await this.transactionRepo.delete(toDelete.map(tx => tx.id));
        }
    }

    return this.carryRepo.delete({ id, tenantId });
  }

  async assignDiscountProfile(profileId: string, dto: any, tenantId: string) {
    const query = this.studentRepo.createQueryBuilder('student')
      .where('student.isActive = :isActive AND student.tenantId = :tenantId', { isActive: true, tenantId });

    if (dto.studentIds && dto.studentIds.length > 0) {
      query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });
    } else {
      if (dto.classIds && dto.classIds.length > 0) query.andWhere('student.classId IN (:...classIds)', { classIds: dto.classIds });
      if (dto.sectionIds && dto.sectionIds.length > 0) query.andWhere('student.sectionId IN (:...sectionIds)', { sectionIds: dto.sectionIds });
    }

    let students = await query.getMany();
    if (dto.excludeIds && dto.excludeIds.length > 0) {
      students = students.filter(s => !dto.excludeIds?.includes(s.id));
    }

    if (students.length === 0) return { updatedCount: 0 };

    await this.studentRepo.update(
      { id: In(students.map(s => s.id)), tenantId },
      { discountProfileId: profileId }
    );

    return { updatedCount: students.length };
  }

  async simulateDiscountAssignment(dto: any, tenantId: string) {
    const query = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .where('student.isActive = :isActive AND student.tenantId = :tenantId', { isActive: true, tenantId });

    if (dto.classIds?.length > 0) query.andWhere('student.classId IN (:...classIds)', { classIds: dto.classIds });
    if (dto.sectionIds?.length > 0) query.andWhere('student.sectionId IN (:...sectionIds)', { sectionIds: dto.sectionIds });
    if (dto.categoryIds?.length > 0) query.andWhere('student.categoryId IN (:...categoryIds)', { categoryIds: dto.categoryIds });
    if (dto.studentIds?.length > 0) query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });

    let students = await query.getMany();
    if (dto.excludeIds?.length > 0) {
        students = students.filter(s => !dto.excludeIds.includes(s.id));
    }

    return {
      total: students.length,
      conflicts: students.filter(s => !!s.discountProfileId).length,
      students: students.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        className: s.class?.name || 'No Class',
        alreadyHasDiscount: !!s.discountProfileId
      }))
    };
  }

  async simulateBulkFeeAssignment(groupId: string, dto: any, tenantId: string) {
    const query = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .where('student.isActive = :isActive AND student.tenantId = :tenantId', { isActive: true, tenantId });

    if (dto.classIds?.length > 0) query.andWhere('student.classId IN (:...classIds)', { classIds: dto.classIds });
    if (dto.sectionIds?.length > 0) query.andWhere('student.sectionId IN (:...sectionIds)', { sectionIds: dto.sectionIds });
    if (dto.categoryIds?.length > 0) query.andWhere('student.categoryId IN (:...categoryIds)', { categoryIds: dto.categoryIds });
    if (dto.studentIds?.length > 0) query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });

    let students = await query.getMany();
    if (dto.excludeIds?.length > 0) {
      students = students.filter(s => !dto.excludeIds.includes(s.id));
    }

    if (students.length === 0) {
      return { total: 0, conflicts: 0, students: [] };
    }

    const existing = await this.assignmentRepo.find({
      where: {
        feeGroupId: groupId,
        studentId: In(students.map(s => s.id)),
        tenantId,
        isActive: true
      }
    });

    const alreadyAssignedIds = new Set(existing.map(e => e.studentId));

    return {
      total: students.length,
      conflicts: alreadyAssignedIds.size,
      students: students.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        className: s.class?.name || 'No Class',
        alreadyHasFee: alreadyAssignedIds.has(s.id)
      }))
    };
  }

  async bulkAssignFeeGroup(groupId: string, dto: any, tenantId: string) {
    const query = this.studentRepo.createQueryBuilder('student')
      .where('student.isActive = :isActive AND student.tenantId = :tenantId', { isActive: true, tenantId });

    if (dto.studentIds && dto.studentIds.length > 0) {
      query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });
    }

    const students = await query.getMany();
    
    const existingAssignments = await this.assignmentRepo.find({
      where: {
        feeGroupId: groupId,
        studentId: In(students.map(s => s.id)),
        tenantId,
        isActive: true
      }
    });

    const alreadyAssignedIds = new Set(existingAssignments.map(a => a.studentId));
    const studentsToAssign = students.filter(s => !alreadyAssignedIds.has(s.id));

    if (studentsToAssign.length === 0) return { updatedCount: 0 };

    const sessionId = await this.systemSettingsService.getActiveSessionId();
    const sessionLabel = new Date().getFullYear().toString();
    const assignments = studentsToAssign.map(s => this.assignmentRepo.create({
      studentId: s.id,
      feeGroupId: groupId,
      sessionId: sessionId || undefined,
      session: sessionLabel,
      tenantId,
      isActive: true
    }));

    await this.assignmentRepo.save(assignments);
    return { 
      updatedCount: assignments.length,
      skippedCount: alreadyAssignedIds.size
    };
  }

  async verifyPaystackPayment(reference: string, meta: any, studentId: string, tenantId: string) {
    return this.transactionRepo.manager.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [reference]);
      try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        });

        const data = response.data;
        if (data.status && data.data.status === 'success') {
          const amountPaid = data.data.amount / 100;
          const existingTx = await manager.findOne(Transaction, { where: { reference, tenantId } });
          if (existingTx) throw new ConflictException('Payment already recorded');

          const bulkAllocations = meta?.bulkAllocations;
          if (meta?.isBulk && Array.isArray(bulkAllocations) && bulkAllocations.length > 0) {
            for (const [index, alloc] of bulkAllocations.entries()) {
              await this.recordPayment({
                studentId: alloc.studentId,
                amount: alloc.amount.toString(),
                paymentMethod: PaymentMethod.ONLINE,
                reference: index === 0 ? reference : `${reference}_${index}`,
                type: TransactionType.FEE_PAYMENT,
                meta: { ...meta, isBulkSubTransaction: true, originalReference: reference, gateway: 'PAYSTACK', paystackData: data.data }
              }, tenantId);
            }
          } else {
            await this.recordPayment({
              studentId,
              amount: amountPaid.toString(),
              paymentMethod: PaymentMethod.ONLINE,
              reference,
              type: TransactionType.FEE_PAYMENT,
              meta: { ...meta, gateway: 'PAYSTACK', paystackData: data.data }
            }, tenantId);
          }

          return { success: true };
        }
        throw new BadRequestException('Payment verification failed');
      } catch (error: any) {
        if (error instanceof ConflictException) throw error;
        throw new BadRequestException('Failed to verify payment');
      }
    });
  }

  async verifyFlutterwavePayment(transactionId: string, meta: any, studentId: string, tenantId: string, txRef?: string) {
    return this.transactionRepo.manager.transaction(async (manager) => {
      // Use txRef as primary lock if available
      const lockRef = txRef || `FLW-${transactionId}`;
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockRef]);
      
      try {
        const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
          headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
        });

        const data = response.data;
        if (data.status === 'success' && data.data.status === 'successful') {
          const amountPaid = data.data.amount;
          
          // Use tx_ref from Flutterwave response to stay consistent with webhooks
          const reference = data.data.tx_ref || txRef || `FLW-${transactionId}`;

          const existingTx = await manager.findOne(Transaction, { where: { reference, tenantId } });
          if (existingTx) return { success: true, detail: 'Already recorded' };

          const bulkAllocations = meta?.bulkAllocations;
          if (meta?.isBulk && Array.isArray(bulkAllocations) && bulkAllocations.length > 0) {
            for (const [index, alloc] of bulkAllocations.entries()) {
              await this.recordPayment({
                studentId: alloc.studentId,
                amount: alloc.amount.toString(),
                paymentMethod: PaymentMethod.ONLINE,
                reference: index === 0 ? reference : `${reference}_${index}`,
                type: TransactionType.FEE_PAYMENT,
                meta: { ...meta, isBulkSubTransaction: true, originalReference: reference, gateway: 'FLUTTERWAVE', flutterwaveData: data.data }
              }, tenantId);
            }
          } else {
            await this.recordPayment({
              studentId,
              amount: amountPaid.toString(),
              paymentMethod: PaymentMethod.ONLINE,
              reference,
              type: TransactionType.FEE_PAYMENT,
              meta: { ...meta, gateway: 'FLUTTERWAVE', flutterwaveData: data.data }
            }, tenantId);
          }

          return { success: true };
        }
        throw new BadRequestException('Payment verification failed');
      } catch (error: any) {
        if (error instanceof ConflictException) throw error;
        console.error('Flutterwave verification error:', error.response?.data || error.message);
        throw new BadRequestException('Failed to verify payment with Flutterwave');
      }
    });
  }

  async handlePaystackWebhook(signature: string, body: any) {
    // 1. Verify signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    if (body.event === 'charge.success') {
      const data = body.data;
      const { reference, metadata, amount, customer } = data;
      
      // Resolve IDs from metadata (passed from frontend PaymentModal)
      const tenantId = metadata?.tenantId;
      const studentId = metadata?.studentId;

      if (!tenantId || !studentId) {
        console.warn('Paystack webhook missing metadata:', { reference, metadata });
        return { status: 'ignored', reason: 'Missing metadata' };
      }

      // Concurrency/Idempotency protection
      return this.transactionRepo.manager.transaction(async (manager) => {
        await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`PAYSTACK-WEBHOOK-${reference}`]);

        const existing = await manager.findOne(Transaction, { where: { reference, tenantId } });
        if (existing) return { status: 'success', detail: 'Already processed' };

        const bulkAllocations = metadata?.bulkAllocations;
        if (metadata?.isBulk && Array.isArray(bulkAllocations) && bulkAllocations.length > 0) {
          for (const [index, alloc] of bulkAllocations.entries()) {
            await this.recordPayment({
              studentId: alloc.studentId,
              amount: alloc.amount.toString(),
              paymentMethod: PaymentMethod.ONLINE,
              reference: index === 0 ? reference : `${reference}_${index}`,
              type: TransactionType.FEE_PAYMENT,
              meta: { ...metadata, isBulkSubTransaction: true, originalReference: reference, gateway: 'PAYSTACK', paystackData: data }
            }, tenantId);
          }
        } else {
          await this.recordPayment({
            studentId,
            amount: (amount / 100).toString(),
            paymentMethod: PaymentMethod.ONLINE,
            reference,
            type: TransactionType.FEE_PAYMENT,
            meta: { ...metadata, gateway: 'PAYSTACK', paystackData: data, via: 'webhook' }
          }, tenantId);
        }

        return { status: 'success' };
      });
    }

    return { status: 'ignored', event: body.event };
  }

  async handleFlutterwaveWebhook(hash: string, body: any) {
    // 1. Verify hash (Flutterwave sends a secret hash header for verification)
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    if (secretHash && hash !== secretHash) {
      throw new BadRequestException('Invalid secret hash');
    }

    // 2. Handle nested 'data' object (standard for charge.completed)
    const data = body.data || body;
    const { reference, tx_ref, amount, metadata, status, id: flwId } = data;
    const finalRef = tx_ref || reference || `FLW-${flwId}`;

    if (body.event === 'charge.completed' || (status === 'successful')) {
      const tenantId = metadata?.tenantId;
      const studentId = metadata?.studentId;

      if (!tenantId || !studentId) {
        console.warn('Flutterwave webhook missing metadata:', { finalRef, metadata });
        return { status: 'ignored', reason: 'Missing metadata' };
      }

      // Concurrency/Idempotency protection
      return this.transactionRepo.manager.transaction(async (manager) => {
        const lockRef = `FLW-WEBHOOK-${finalRef}`;
        await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockRef]);

        const existing = await manager.findOne(Transaction, { where: { reference: finalRef, tenantId } });
        if (existing) return { status: 'success', detail: 'Already processed' };

        const bulkAllocations = metadata?.bulkAllocations;
        if (metadata?.isBulk && Array.isArray(bulkAllocations) && bulkAllocations.length > 0) {
          for (const [index, alloc] of bulkAllocations.entries()) {
            await this.recordPayment({
              studentId: alloc.studentId,
              amount: alloc.amount.toString(),
              paymentMethod: PaymentMethod.ONLINE,
              reference: index === 0 ? finalRef : `${finalRef}_${index}`,
              type: TransactionType.FEE_PAYMENT,
              meta: { ...metadata, isBulkSubTransaction: true, originalReference: finalRef, gateway: 'FLUTTERWAVE', flutterwaveData: data }
            }, tenantId);
          }
        } else {
          await this.recordPayment({
            studentId,
            amount: amount.toString(),
            paymentMethod: PaymentMethod.ONLINE,
            reference: finalRef,
            type: TransactionType.FEE_PAYMENT,
            meta: { ...metadata, gateway: 'FLUTTERWAVE', flutterwaveData: data, via: 'webhook', flwId }
          }, tenantId);
        }

        return { status: 'success' };
      });
    }

    return { status: 'ignored', event: body.event || status };
  }
}
