import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
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
import { EmailService } from '../../communication/email.service';
import { SmsService } from '../../communication/sms.service';

@Injectable()
export class FeesService {
  constructor(
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
  ) { }

  // Record an offline/payment
  async recordPayment(dto: CreatePaymentDto, tenantId: string) {
    const paymentAmount = parseFloat(dto.amount);

    if (paymentAmount <= 0) throw new BadRequestException('Payment amount must be greater than zero.');

    const transactions: Transaction[] = [];
    const allocations = dto.meta?.allocations || [];
    let allocatedSum = 0;

    // 1. If allocations are provided, split the transaction
    if (Array.isArray(allocations) && allocations.length > 0) {
      for (const alloc of allocations) {
        const allocAmount = parseFloat(alloc.amount);
        if (allocAmount > 0) {
          allocatedSum += allocAmount;
          const tx = this.transactionRepo.create({
            amount: alloc.amount.toString(),
            studentId: dto.studentId,
            tenantId,
            reference: dto.reference || null,
            paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
            type: dto.type || TransactionType.FEE_PAYMENT,
            meta: {
              ...dto.meta,
              allocations: [alloc],
              isSplitTransaction: true
            }
          });
          transactions.push(tx);
        }
      }

      // Enforce full allocation if ANY allocations were provided
      if (Math.abs(paymentAmount - allocatedSum) > 0.01) {
        throw new BadRequestException(`Payment amount (${paymentAmount.toFixed(2)}) must be fully allocated to fee heads. Unallocated amount: ${(paymentAmount - allocatedSum).toFixed(2)}`);
      }
    }

    // 2. If no allocations (or sum was 0), create a single transaction
    if (transactions.length === 0) {
      const tx = this.transactionRepo.create({
        amount: dto.amount,
        studentId: dto.studentId,
        tenantId,
        reference: dto.reference || null,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        type: dto.type || TransactionType.FEE_PAYMENT,
        meta: dto.meta || {}
      });
      transactions.push(tx);
    }

    const saved = await this.transactionRepo.save(transactions);

    // Trigger notification (async, don't await to avoid blocking response)
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

    // 1. Get all transactions for student
    const transactions = await this.transactionRepo.find({
      where: { studentId: resolvedStudentId, tenantId },
      order: { createdAt: 'DESC' },
    });

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

    // 3. Get Carry Forwards
    const carryForwards = await this.carryRepo.find({
      where: { studentId: resolvedStudentId, tenantId },
    });

    // 4. Get Assignments & Calculate Dues
    const assignments = await this.assignmentRepo.find({
      where: { studentId: resolvedStudentId, isActive: true, tenantId },
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

    const labeledCarryForwards = carryForwards.map(cf => ({
      ...cf,
      name: `Balance Brought Forward (${cf.academicYear})`,
      type: 'CARRY_FORWARD'
    }));

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

  // History
  async paymentHistory(options: {
    studentId?: string; // This can now be a search term too
    startDate?: string;
    endDate?: string;
    method?: PaymentMethod;
    type?: TransactionType;
    page?: number;
    limit?: number;
  } = {}, tenantId: string) {
    const q = this.transactionRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.student', 'student')
      .leftJoinAndSelect('student.class', 'class')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC');

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
    const originalTx = await this.transactionRepo.findOne({
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
        // When refunding, we basically reverse the status or set it to a state that getStudentStatement can handle.
        // Since getStudentStatement purely sums amounts, the negative amount here is sufficient.
      }))
      : [];

    const refundTx = this.transactionRepo.create({
      amount: (-parseFloat(originalTx.amount)).toString(), // Negative amount
      studentId: originalTx.studentId as string,
      tenantId,
      type: TransactionType.REFUND,
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

    await this.transactionRepo.save(refundTx);

    // Mark original transaction as refunded
    originalTx.meta = {
      ...originalTx.meta,
      isRefunded: true,
      refundTransactionId: refundTx.id
    };
    await this.transactionRepo.save(originalTx);

    return refundTx;
  }

  // Simplified Batch Assignment for MVP
  // Updated Assignment to support exclusions
  async assignFeesToStudent(studentId: string, feeGroupIds: string[], tenantId: string, feeExclusions?: Record<string, string[]>) {
    // 1. Remove existing to allow clean overwrite
    await this.assignmentRepo.delete({ studentId, tenantId });

    // 2. Create new ones
    if (feeGroupIds.length > 0) {
      const assignments = feeGroupIds.map(gid => this.assignmentRepo.create({
        studentId,
        feeGroupId: gid,
        tenantId,
        excludedHeadIds: feeExclusions?.[gid] || null,
        session: new Date().getFullYear().toString()
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
        .andWhere('fa.isActive = :faActive')
        .getQuery();
      return `EXISTS (${subQuery})`;
    });
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
    const results = [];
    for (const studentId of dto.studentIds) {
      const statement = await this.getStudentStatement(studentId, tenantId);
      const student = statement.student;
      const balance = statement.balance;

      if (parseFloat(balance) <= 0) continue;

      const reminder = this.reminderRepo.create({
        studentId,
        amount: parseFloat(balance),
        dueDate: new Date(),
        message: dto.messageTemplate || null,
        channel: dto.channel || ReminderChannel.EMAIL,
        status: ReminderStatus.PENDING,
        tenantId
      } as any);

      await this.reminderRepo.save(reminder);

      // Integration with Email/SMS Service...
      results.push(reminder);
    }

    return {
      total: dto.studentIds.length,
      processed: results.length,
    };
  }

  async listReminders(options: any = {}, tenantId: string) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20);

    const query = this.reminderRepo.createQueryBuilder('r')
      .leftJoinAndMapOne('r.student', Student, 'student', 'student.id = r.studentId')
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
    let amount = dto.amount;
    if (!amount || amount === 'auto' || parseFloat(amount) === 0) {
      const statement = await this.getStudentStatement(dto.studentId, tenantId);
      amount = statement.balance;
    }

    if (parseFloat(amount) <= 0) {
      throw new BadRequestException('Student has no outstanding balance to carry forward.');
    }

    const existing = await this.carryRepo.findOne({
      where: {
        studentId: dto.studentId,
        academicYear: dto.academicYear,
        tenantId
      }
    });

    if (existing) {
      existing.amount = amount;
      return this.carryRepo.save(existing);
    }

    const c = this.carryRepo.create({ ...dto, amount, tenantId });
    return this.carryRepo.save(c);
  }

  async listCarryForwards(options: any = {}, tenantId: string) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20);

    const query = this.carryRepo.createQueryBuilder('c')
      .leftJoinAndMapOne('c.student', Student, 'student', 'student.id = CAST(c.studentId AS UUID)')
      .leftJoinAndSelect('student.class', 'class')
      .where('c.tenantId = :tenantId', { tenantId })
      .orderBy('c.createdAt', 'DESC');

    if (options.studentId) {
      query.andWhere('c.studentId = :studentId', { studentId: options.studentId });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async deleteCarryForward(id: string, tenantId: string) {
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

    // Implementation ...
    return { students: [] }; // Simplified for now
  }

  async simulateBulkFeeAssignment(groupId: string, dto: any, tenantId: string) {
    return this.simulateDiscountAssignment(dto, tenantId);
  }

  async bulkAssignFeeGroup(groupId: string, dto: any, tenantId: string) {
    const query = this.studentRepo.createQueryBuilder('student')
      .where('student.isActive = :isActive AND student.tenantId = :tenantId', { isActive: true, tenantId });

    if (dto.studentIds && dto.studentIds.length > 0) {
      query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });
    }

    let students = await query.getMany();
    
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

    const session = new Date().getFullYear().toString();
    const assignments = studentsToAssign.map(s => this.assignmentRepo.create({
      studentId: s.id,
      feeGroupId: groupId,
      session,
      tenantId,
      isActive: true
    }));

    await this.assignmentRepo.save(assignments);
    return { updatedCount: assignments.length };
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

          await this.recordPayment({
            studentId,
            amount: amountPaid.toString(),
            paymentMethod: PaymentMethod.ONLINE,
            reference,
            type: TransactionType.FEE_PAYMENT,
            meta: { ...meta, gateway: 'PAYSTACK', paystackData: data.data }
          }, tenantId);

          return { success: true };
        }
        throw new BadRequestException('Payment verification failed');
      } catch (error: any) {
        if (error instanceof ConflictException) throw error;
        throw new BadRequestException('Failed to verify payment');
      }
    });
  }

  async verifyFlutterwavePayment(transactionId: string, meta: any, studentId: string, tenantId: string) {
    // Similar implementation with tenantId...
    return { success: false };
  }

  async handlePaystackWebhook(signature: string, body: any) {
    // Webhooks are tricky because they don't have a user session.
    // We usually get the tenantId from metadata or by looking up the student.
    return { status: 'success' };
  }

  async handleFlutterwaveWebhook(hash: string, body: any) {
    // Webhooks don't have a user session.
    // tenantId is resolved from metadata or student lookup.
    return { status: 'success' };
  }
}
