import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
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
  ) { }

  // Record an offline/payment
  async recordPayment(dto: CreatePaymentDto) {
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
        reference: dto.reference || null,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        type: dto.type || TransactionType.FEE_PAYMENT,
        meta: dto.meta || {}
      });
      transactions.push(tx);
    }

    return this.transactionRepo.save(transactions);
  }

  async getStudentStatement(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['class'],
    });

    if (!student) throw new NotFoundException('Student not found');

    // 1. Get all transactions for student
    const transactions = await this.transactionRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });

    // 2. Get Discount Profile
    let discountProfile = null;
    if (student.discountProfileId) {
      discountProfile = await this.discountProfileRepo.findOne({
        where: { id: student.discountProfileId, isActive: true },
        relations: ['rules']
      });

      // Check for expiry
      if (discountProfile && discountProfile.expiryDate && new Date() > new Date(discountProfile.expiryDate)) {
        discountProfile = null;
      }
    }

    // 3. Get Carry Forwards
    const carryForwards = await this.carryRepo.find({
      where: { studentId },
    });

    // 4. Get Assignments & Calculate Dues
    const assignments = await this.assignmentRepo.find({
      where: { studentId, isActive: true },
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
  } = {}) {
    const q = this.transactionRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.student', 'student')
      .leftJoinAndSelect('student.class', 'class')
      .orderBy('t.createdAt', 'DESC');

    if (options.studentId) {
      // Check if it looks like a UUID (exact ID match)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.studentId);

      if (isUUID) {
        q.andWhere('t.studentId = :studentId', { studentId: options.studentId });
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
  async refundTransaction(id: string, reason: string) {
    const originalTx = await this.transactionRepo.findOne({
      where: { id },
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
  async assignFeesToStudent(studentId: string, feeGroupIds: string[], feeExclusions?: Record<string, string[]>) {
    // 1. Remove existing to allow clean overwrite
    await this.assignmentRepo.delete({ studentId });

    // 2. Create new ones
    if (feeGroupIds.length > 0) {
      const assignments = feeGroupIds.map(gid => this.assignmentRepo.create({
        studentId,
        feeGroupId: gid,
        excludedHeadIds: feeExclusions?.[gid] || null,
        session: new Date().getFullYear().toString()
      }));
      await this.assignmentRepo.save(assignments);
    }
  }

  async getAssignmentsByStudent(studentId: string) {
    return this.assignmentRepo.find({
      where: { studentId, isActive: true }
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
  } = {}) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 50);
    const { classId, search } = options;

    const query = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .where('student.isActive = :isActive', { isActive: true });

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
        .andWhere('fa.isActive = :faActive')
        .getQuery();
      return `EXISTS (${subQuery})`;
    });
    query.setParameters({ faActive: true });

    const students = await query
      .orderBy('student.firstName', 'ASC')
      .getMany();

    // Calculate real statement for each student to find true debtors
    const allDebtors = await Promise.all(students.map(async (student) => {
      const statement = await this.getStudentStatement(student.id);
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

  async getFamilyFinancials(studentId: string) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    let siblings: Student[] = [student];

    if (student.parentId) {
      siblings = await this.studentRepo.find({
        where: { parentId: student.parentId, isActive: true },
        relations: ['class']
      });
    }

    const familyData = await Promise.all(siblings.map(async (sib) => {
      const statement = await this.getStudentStatement(sib.id);
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

  // --- Fee Head Management ---
  async createHead(dto: CreateFeeHeadDto) {
    const head = this.headRepo.create(dto);
    return this.headRepo.save(head);
  }

  async listHeads() {
    return this.headRepo.find({ order: { name: 'ASC' } });
  }

  async deleteHead(id: string) {
    return this.headRepo.delete(id);
  }

  async updateHead(id: string, dto: Partial<CreateFeeHeadDto>) {
    await this.headRepo.update(id, dto);
    return this.headRepo.findOne({ where: { id } });
  }

  // --- Fee Group Management ---
  async createGroup(dto: CreateFeeGroupDto) {
    const heads = await this.headRepo.findBy({
      id: In(dto.headIds)
    });
    const group = this.groupRepo.create({
      ...dto,
      heads
    });
    return this.groupRepo.save(group);
  }

  async listGroups() {
    return this.groupRepo.find({
      relations: ['heads'],
      order: { name: 'ASC' }
    });
  }

  async deleteGroup(id: string) {
    return this.groupRepo.delete(id);
  }

  async updateGroup(id: string, dto: Partial<CreateFeeGroupDto>) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new Error('Group not found');

    if (dto.name) group.name = dto.name;
    if (dto.description !== undefined) group.description = dto.description || null;

    if (dto.headIds) {
      group.heads = await this.headRepo.findBy({
        id: In(dto.headIds)
      });
    }

    return this.groupRepo.save(group);
  }

  // --- Discount Management ---
  async createDiscountProfile(dto: CreateDiscountProfileDto) {
    const profile = this.discountProfileRepo.create({
      name: dto.name,
      description: dto.description || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
    });

    const savedProfile = await this.discountProfileRepo.save(profile);

    if (dto.rules && dto.rules.length > 0) {
      const rules = dto.rules.map(r => this.discountRuleRepo.create({
        ...r,
        profileId: savedProfile.id
      }));
      await this.discountRuleRepo.save(rules);
    }

    return this.getDiscountProfile(savedProfile.id);
  }

  async updateDiscountProfile(id: string, dto: CreateDiscountProfileDto) {
    const profile = await this.discountProfileRepo.findOne({ where: { id } });
    if (!profile) throw new Error('Discount profile not found');

    profile.name = dto.name;
    profile.description = dto.description || null;
    if (dto.isActive !== undefined) profile.isActive = dto.isActive;
    profile.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;

    await this.discountProfileRepo.save(profile);

    // Replace rules: delete old, insert new
    await this.discountRuleRepo.delete({ profileId: id });

    if (dto.rules && dto.rules.length > 0) {
      const rules = dto.rules.map(r => this.discountRuleRepo.create({
        ...r,
        profileId: id
      }));
      await this.discountRuleRepo.save(rules);
    }

    return this.getDiscountProfile(id);
  }

  async listDiscountProfiles() {
    return this.discountProfileRepo.find({
      relations: ['rules', 'rules.feeHead'],
      order: { name: 'ASC' }
    });
  }

  async getDiscountProfile(id: string) {
    const profile = await this.discountProfileRepo.findOne({
      where: { id },
      relations: ['rules', 'rules.feeHead']
    });
    if (!profile) throw new Error('Discount profile not found');
    return profile;
  }

  async deleteDiscountProfile(id: string) {
    return this.discountProfileRepo.delete(id);
  }

  // Fee Structure (Legacy support or simple structures)
  async createStructure(dto: CreateStructureDto) {
    const s = this.structureRepo.create(dto as any);
    return this.structureRepo.save(s);
  }

  async listStructures() {
    return this.structureRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Discounts
  async createDiscount(dto: CreateDiscountDto) {
    const d = this.discountRepo.create(dto as any);
    return this.discountRepo.save(d);
  }

  async listDiscounts() {
    return this.discountRepo.find({ where: { active: true } });
  }

  // Reminders
  async createReminder(dto: CreateReminderDto) {
    const r = this.reminderRepo.create({
      studentId: dto.studentId,
      dueDate: new Date(dto.dueDate),
      message: dto.message || null,
      status: ReminderStatus.PENDING,
      channel: ReminderChannel.EMAIL, // Default
    });
    return this.reminderRepo.save(r);
  }

  async sendBulkReminders(dto: BulkReminderDto) {
    const results = [];

    for (const studentId of dto.studentIds) {
      const statement = await this.getStudentStatement(studentId);
      const student = statement.student;
      const balance = statement.balance;

      if (parseFloat(balance) <= 0) continue;

      const reminder = this.reminderRepo.create({
        studentId,
        amount: parseFloat(balance),
        dueDate: new Date(), // Using current date as it's a "now" reminder
        message: dto.messageTemplate || null,
        channel: dto.channel,
        status: ReminderStatus.PENDING,
      });

      await this.reminderRepo.save(reminder);

      let sentEmail = false;
      let sentSms = false;

      try {
        if (dto.channel === ReminderChannel.EMAIL || dto.channel === ReminderChannel.BOTH) {
          if (student.email) {
            sentEmail = await this.emailService.sendPaymentReminderEmail(
              student.email,
              `${student.firstName} ${student.lastName}`,
              balance,
              new Date().toLocaleDateString(),
              dto.messageTemplate,
            );
          }
        }

        if (dto.channel === ReminderChannel.SMS || dto.channel === ReminderChannel.BOTH) {
          const phoneNumber = student.mobileNumber || student.fatherPhone || student.guardianPhone;
          if (phoneNumber) {
            sentSms = await this.smsService.sendPaymentReminderSms(
              phoneNumber,
              `${student.firstName} ${student.lastName}`,
              balance,
              dto.messageTemplate,
            );
          }
        }

        const success = (dto.channel === ReminderChannel.BOTH) ? (sentEmail || sentSms) : (sentEmail || sentSms);

        reminder.status = success ? ReminderStatus.SENT : ReminderStatus.FAILED;
        reminder.sent = success;
        if (!success) reminder.error = 'Failed to deliver via selected channel(s)';
      } catch (err: any) {
        reminder.status = ReminderStatus.FAILED;
        reminder.error = err.message;
      }

      await this.reminderRepo.save(reminder);
      results.push(reminder);
    }

    return {
      total: dto.studentIds.length,
      processed: results.length,
      sent: results.filter(r => r.status === ReminderStatus.SENT).length,
    };
  }

  async listReminders(options: { studentId?: string; page?: number | string; limit?: number | string } = {}) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20);

    const query = this.reminderRepo.createQueryBuilder('r')
      .leftJoinAndMapOne('r.student', Student, 'student', 'student.id = r.studentId')
      .orderBy('r.createdAt', 'DESC');

    if (options.studentId) {
      query.andWhere('r.studentId = :studentId', { studentId: options.studentId });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  // Carry forward
  async carryForward(dto: CarryForwardDto) {
    let amount = dto.amount;

    // If amount is not provided or 'auto', calculate it from student statement
    if (!amount || amount === 'auto' || parseFloat(amount) === 0) {
      const statement = await this.getStudentStatement(dto.studentId);
      amount = statement.balance;
    }

    if (parseFloat(amount) <= 0) {
      throw new BadRequestException('Student has no outstanding balance to carry forward.');
    }

    // Check if carry forward already exists for this year to avoid duplicates
    const existing = await this.carryRepo.findOne({
      where: {
        studentId: dto.studentId,
        academicYear: dto.academicYear
      }
    });

    if (existing) {
      existing.amount = amount;
      return this.carryRepo.save(existing);
    }

    const c = this.carryRepo.create({
      ...dto,
      amount
    } as any);
    return this.carryRepo.save(c);
  }

  async listCarryForwards(options: { studentId?: string; academicYear?: string; page?: number; limit?: number } = {}) {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20);

    const query = this.carryRepo.createQueryBuilder('c')
      .leftJoinAndMapOne('c.student', Student, 'student', 'student.id = CAST(c.studentId AS UUID)')
      .leftJoinAndSelect('student.class', 'class')
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

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async deleteCarryForward(id: string) {
    const record = await this.carryRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Carry forward record not found');
    await this.carryRepo.remove(record);
    return { success: true };
  }

  async assignDiscountProfile(profileId: string, dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }) {
    const query = this.studentRepo.createQueryBuilder('student')
      .where('student.isActive = :isActive', { isActive: true });

    if (dto.studentIds && dto.studentIds.length > 0) {
      query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });
    } else {
      if (dto.classIds && dto.classIds.length > 0) {
        query.andWhere('student.classId IN (:...classIds)', { classIds: dto.classIds });
      }
      if (dto.sectionIds && dto.sectionIds.length > 0) {
        query.andWhere('student.sectionId IN (:...sectionIds)', { sectionIds: dto.sectionIds });
      }
      if (dto.categoryIds && dto.categoryIds.length > 0) {
        query.andWhere('student.categoryId IN (:...categoryIds)', { categoryIds: dto.categoryIds });
      }
    }

    let students = await query.getMany();
    if (dto.excludeIds && dto.excludeIds.length > 0) {
      students = students.filter(s => !dto.excludeIds?.includes(s.id));
    }

    if (students.length === 0) return { updatedCount: 0 };

    await this.studentRepo.update(
      { id: In(students.map(s => s.id)) },
      { discountProfileId: profileId }
    );

    return { updatedCount: students.length };
  }

  async simulateDiscountAssignment(dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }) {
    const query = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('student.section', 'section')
      .leftJoinAndSelect('student.category', 'category')
      .where('student.isActive = :isActive', { isActive: true });

    if (dto.studentIds && dto.studentIds.length > 0) {
      query.andWhere('student.id IN (:...studentIds)', { studentIds: dto.studentIds });
    } else {
      if (dto.classIds && dto.classIds.length > 0) {
        query.andWhere('student.classId IN (:...classIds)', { classIds: dto.classIds });
      }
      if (dto.sectionIds && dto.sectionIds.length > 0) {
        query.andWhere('student.sectionId IN (:...sectionIds)', { sectionIds: dto.sectionIds });
      }
      if (dto.categoryIds && dto.categoryIds.length > 0) {
        query.andWhere('student.categoryId IN (:...categoryIds)', { categoryIds: dto.categoryIds });
      }
    }

    const students = await query.getMany();
    const profiles = await this.discountProfileRepo.find();
    const profileMap = new Map(profiles.map(p => [p.id, p.name]));

    const affectedStudents = students.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      className: `${s.class?.name || 'No Class'} ${s.section?.name || ''}`.trim(),
      currentPolicyId: s.discountProfileId,
      currentPolicyName: s.discountProfileId ? profileMap.get(s.discountProfileId) : null
    }));

    return {
      total: affectedStudents.length,
      conflicts: affectedStudents.filter(s => s.currentPolicyId).length,
      students: affectedStudents
    };
  }
}
