import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { StudentAttendance } from '../students/entities/student-attendance.entity';
import { Class } from '../academics/entities/class.entity';
import { Section } from '../academics/entities/section.entity';
import { CommunicationLog } from '../communication/entities/communication-log.entity';
import { StudentDocument } from '../students/entities/student-document.entity';
import { StudentTermResult } from '../examination/entities/student-term-result.entity';
import { ExamGroup } from '../examination/entities/exam-group.entity';
import { FeeAssignment } from '../finance/entities/fee-assignment.entity';
import { DiscountProfile } from '../finance/entities/discount-profile.entity';
import { SystemSetting } from '../system/entities/system-setting.entity';
import { FeeGroup } from '../finance/entities/fee-group.entity';
import { FeeHead } from '../finance/entities/fee-head.entity';
import { StudentsService } from '../students/services/students.service';
import { FeesService } from '../finance/services/fees.service';
import { CarryForward } from '../finance/entities/carry-forward.entity';

/** Records older than this many months are excluded from pull-all syncs */
const ROLLING_MONTHS = 3;

function threeMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - ROLLING_MONTHS);
  return d;
}

function calculateDiscountedAmount(headAmount: string | number, feeHeadId: string, discountProfile: any | null): number {
  const amount = typeof headAmount === 'string' ? parseFloat(headAmount || '0') : headAmount;
  if (!discountProfile || !discountProfile.rules) return amount;

  const rule = discountProfile.rules.find((r: any) => r.feeHeadId === feeHeadId);
  if (!rule) return amount;

  if (rule.percentage) {
    const discount = (amount * parseFloat(rule.percentage)) / 100;
    return Math.max(0, amount - discount);
  } else if (rule.fixedAmount) {
    return Math.max(0, amount - parseFloat(rule.fixedAmount));
  }

  return amount;
}

function mapAssignmentToTransactions(assignment: FeeAssignment, discountProfile: any | null): any[] {
  if (!assignment.feeGroup || !assignment.feeGroup.heads) return [];

  const transactions: any[] = [];

  for (const head of assignment.feeGroup.heads) {
    if (assignment.excludedHeadIds?.includes(head.id)) {
      continue;
    }

    const discountedAmount = calculateDiscountedAmount(head.defaultAmount || '0', head.id, discountProfile);

    transactions.push({
      id: `${assignment.id}_${head.id}`, // Make it unique per student assignment + head
      amount: discountedAmount.toFixed(2),
      type: 'charge',
      studentId: assignment.studentId,
      tenantId: assignment.tenantId,
      sessionId: assignment.sessionId || null,
      feeGroupId: assignment.feeGroupId || null,
      paymentMethod: 'SYSTEM',
      reference: null,
      processedBy: null,
      schoolSectionId: null,
      meta: {
        name: head.name,
        feeGroupName: assignment.feeGroup.name,
        isFeeHead: true,
        feeHeadId: head.id, // Store the real feeHeadId here so the mobile app can use it for allocations
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      deletedAt: null,
    });
  }

  return transactions;
}

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(StudentAttendance)
    private attendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(Section)
    private sectionsRepository: Repository<Section>,
    @InjectRepository(CommunicationLog)
    private communicationLogsRepository: Repository<CommunicationLog>,
    @InjectRepository(StudentDocument)
    private studentDocumentsRepository: Repository<StudentDocument>,
    @InjectRepository(StudentTermResult)
    private studentTermResultsRepository: Repository<StudentTermResult>,
    @InjectRepository(ExamGroup)
    private examGroupsRepository: Repository<ExamGroup>,
    @InjectRepository(FeeAssignment)
    private feeAssignmentsRepository: Repository<FeeAssignment>,
    @InjectRepository(DiscountProfile)
    private discountProfileRepository: Repository<DiscountProfile>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(FeeGroup)
    private feeGroupRepository: Repository<FeeGroup>,
    @InjectRepository(FeeHead)
    private feeHeadRepository: Repository<FeeHead>,
    @InjectRepository(CarryForward)
    private carryForwardRepository: Repository<CarryForward>,
    @Inject(forwardRef(() => StudentsService))
    private studentsService: StudentsService,
    @Inject(forwardRef(() => FeesService))
    private feesService: FeesService,
  ) { }

  /**
   * Auto-generates meta.allocations from the student's active fee assignments.
   * Called when a mobile payment arrives without fee-head breakdowns.
   * Distributes the payment across fee heads proportionally and sets PARTIAL/PAID status.
   */
  private async buildAllocationsFromAssignments(
    studentId: string,
    tenantId: string,
    sessionId: string | null,
    paidAmount: number,
    existingMeta: any,
  ): Promise<any> {
    try {
      const assignmentWhere: any = { studentId, tenantId, isActive: true };
      if (sessionId) assignmentWhere.sessionId = sessionId;

      const assignments = await this.feeAssignmentsRepository.find({
        where: assignmentWhere,
        relations: ['feeGroup', 'feeGroup.heads'],
      });

      // Collect all fee heads from all assignments
      const feeHeads: { id: string; name: string; defaultAmount: number }[] = [];
      for (const assignment of assignments) {
        const excluded = assignment.excludedHeadIds || [];
        for (const head of (assignment.feeGroup?.heads || [])) {
          if (!excluded.includes(head.id)) {
            feeHeads.push({ id: head.id, name: head.name, defaultAmount: parseFloat(head.defaultAmount || '0') });
          }
        }
      }

      if (feeHeads.length === 0) {
        // No fee structure found — create a single generic allocation
        return {
          ...existingMeta,
          allocations: [{
            id: studentId,
            name: 'Fee Payment',
            amount: paidAmount.toFixed(2),
            totalDue: paidAmount.toFixed(2),
            balance: '0.00',
            status: 'PAID',
          }],
        };
      }

      const totalDue = feeHeads.reduce((sum, h) => sum + h.defaultAmount, 0);
      let remaining = paidAmount;

      // Distribute payment across fee heads in order (greedy fill)
      const allocations = feeHeads.map(head => {
        const headDue = head.defaultAmount;
        const headPaid = Math.min(remaining, headDue);
        remaining -= headPaid;
        const headBalance = Math.max(0, headDue - headPaid);
        return {
          id: head.id,
          name: head.name,
          amount: headPaid.toFixed(2),
          totalDue: headDue.toFixed(2),
          balance: headBalance.toFixed(2),
          status: headPaid >= headDue ? 'PAID' : headPaid > 0 ? 'PARTIAL' : 'UNPAID',
        };
      }).filter(a => parseFloat(a.amount) > 0); // Only include heads that received any payment

      return {
        ...existingMeta,
        allocations,
        mobilePayment: true, // flag so we know this was auto-generated
      };
    } catch (err) {
      console.error('[Sync] Failed to build allocations from assignments:', err);
      return existingMeta; // fall back to original meta on error
    }
  }

  private async getStudentDiscountProfiles(tenantId: string) {
    const profiles = await this.discountProfileRepository.find({
      where: { tenantId, isActive: true },
      relations: ['rules']
    });

    // Filter out expired ones
    const activeProfiles = profiles.filter(p => !p.expiryDate || new Date() <= new Date(p.expiryDate));

    // We also need all students to know their discountProfileId.
    const allStudents = await this.studentsRepository.find({
      where: { tenantId },
      select: ['id', 'discountProfileId']
    });

    const profileMap = new Map(activeProfiles.map(p => [p.id, p]));
    const studentProfileMap = new Map<string, any>();

    for (const student of allStudents) {
      if (student.discountProfileId && profileMap.has(student.discountProfileId)) {
        studentProfileMap.set(student.id, profileMap.get(student.discountProfileId));
      }
    }

    return studentProfileMap;
  }

  async getPullChanges(lastPulledAt: Date, tenantId: string) {
    const cutoff = threeMonthsAgo();

    // Charge records are generated from fee assignments. The FeeGroup<->FeeHead
    // relationship is ManyToMany via a join table (fee_group_heads) with NO timestamps.
    // Adding/removing a fee head from a group only inserts/deletes a join table row —
    // no updatedAt changes on FeeAssignment, FeeGroup, or FeeHead.
    // Therefore we ALWAYS fetch ALL active assignments for the tenant so the
    // mobile app always has a complete, up-to-date set of charge records (WatermelonDB upserts them).
    const allAssignmentsQuery = this.feeAssignmentsRepository
      .createQueryBuilder('fa')
      .leftJoinAndSelect('fa.feeGroup', 'fg')
      .leftJoinAndSelect('fg.heads', 'fh')
      .where('fa.tenantId = :tenantId', { tenantId })
      .andWhere('fa.isActive = true');

    const [students, transactions, assignments, attendance, classes, sections, commLogs, docs, termResults, examGroups, studentProfileMap, feeGroups, carryForwards] =
      await Promise.all([
        // Core tables — no 3-month cap (students are master data)
        this.studentsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
          withDeleted: true,
        }),
        this.transactionsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
          withDeleted: true,
        }),
        allAssignmentsQuery.getMany(),
        this.attendanceRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
        }),
        this.classesRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
        }),
        this.sectionsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
        }),
        // Rolling 3-month tables
        this.communicationLogsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId, createdAt: MoreThan(cutoff) },
        }),
        this.studentDocumentsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
        }),
        this.studentTermResultsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId, createdAt: MoreThan(cutoff) },
        }),
        this.examGroupsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId, createdAt: MoreThan(cutoff) },
        }),
        this.getStudentDiscountProfiles(tenantId),
        this.feeGroupRepository.find({ where: { updatedAt: MoreThan(lastPulledAt), tenantId }, relations: ['heads'] }),
        // Always fetch all carry-forwards for this tenant (no timestamp cap — small table)
        this.carryForwardRepository.find({ where: { tenantId }, relations: ['feeHead'] }),
      ]);

    // feeHeads removed — they are embedded inside fee_groups as heads_json

    const chargeRecords = assignments.flatMap(a => mapAssignmentToTransactions(a, studentProfileMap.get(a.studentId) || null));
    const realTransactions = transactions;

    // Map carry-forwards as synthetic fee_records of type charge.
    // The mobile app uses these as DEBTS brought into the new session.
    // (The clearing transaction in the old session is synced via realTransactions).
    const carryForwardRecords = (carryForwards || []).map((cf: CarryForward) => ({
      id: `cf_${cf.id}`,
      amount: parseFloat(cf.amount || '0'),
      type: 'charge',
      studentId: cf.studentId,
      tenantId: cf.tenantId,
      sessionId: cf.sessionId || null,
      feeGroupId: null,
      paymentMethod: 'SYSTEM',
      reference: null,
      processedBy: null,
      schoolSectionId: null,
      meta: JSON.stringify({
        feeHeadId: cf.feeHeadId || cf.id,  // Use the actual fee head ID, fall back to cf.id
        academicYear: cf.academicYear,
        isCarryForward: true,
        isFeeHead: true,
        name: 'Arrears (Brought Forward)',
        ...(cf.meta || {}),
      }),
      createdAt: cf.createdAt,
      updatedAt: new Date(),
      deletedAt: null,
    }));

    const allFeeGroups = (feeGroups || []).map(g => ({
      ...g,
      heads_json: JSON.stringify(
        (g.heads || []).map(h => ({
          id: h.id,
          name: h.name,
          description: h.description,
          defaultAmount: h.defaultAmount,
          isOptional: h.isOptional,
          isActive: h.isActive,
        }))
      ),
    }));

    return {
      changes: {
        students: {
          created: students.filter(s => s.createdAt > lastPulledAt && !s.deletedAt),
          updated: students.filter(s => s.createdAt <= lastPulledAt && !s.deletedAt),
          deleted: students.filter(s => s.deletedAt).map(s => s.id),
        },
        fee_records: {
          created: [
            ...chargeRecords.filter(c => c.createdAt > lastPulledAt),
            ...carryForwardRecords.filter(c => c.createdAt > lastPulledAt),
            ...realTransactions.filter(t => t.createdAt > lastPulledAt && !t.deletedAt)
          ],
          updated: [
            ...chargeRecords.filter(c => c.createdAt <= lastPulledAt),
            ...carryForwardRecords.filter(c => c.createdAt <= lastPulledAt),
            ...realTransactions.filter(t => t.createdAt <= lastPulledAt && !t.deletedAt)
          ],
          deleted: realTransactions.filter(t => t.deletedAt).map(t => t.id),
        },
        attendance: {
          created: attendance.filter(a => a.createdAt > lastPulledAt),
          updated: attendance.filter(a => a.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        classes: {
          created: classes.filter(c => c.createdAt > lastPulledAt),
          updated: classes.filter(c => c.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        sections: {
          created: sections.filter(s => s.createdAt > lastPulledAt),
          updated: sections.filter(s => s.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        communication_logs: {
          created: commLogs.filter(l => l.createdAt > lastPulledAt),
          updated: commLogs.filter(l => l.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        student_documents: {
          created: docs.filter(d => d.createdAt > lastPulledAt),
          updated: docs.filter(d => d.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        student_term_results: {
          created: termResults.filter(r => r.createdAt > lastPulledAt),
          updated: termResults.filter(r => r.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        exam_groups: {
          created: examGroups.filter(e => e.createdAt > lastPulledAt),
          updated: examGroups.filter(e => e.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
        fee_groups: {
          created: allFeeGroups.filter(g => g.createdAt > lastPulledAt),
          updated: allFeeGroups.filter(g => g.createdAt <= lastPulledAt),
          deleted: [],
        },
      },
      timestamp: Date.now(),
    };
  }

  async getPullAllChanges(tenantId: string) {
    const cutoff = threeMonthsAgo();

    const [students, transactions, assignments, attendance, classes, sections, commLogs, docs, termResults, examGroups, studentProfileMap, feeGroups, carryForwards] =
      await Promise.all([
        this.studentsRepository.find({ where: { tenantId }, withDeleted: true }),
        this.transactionsRepository.find({ where: { tenantId }, withDeleted: true }),
        this.feeAssignmentsRepository.find({ where: { tenantId }, relations: ['feeGroup', 'feeGroup.heads'] }),
        this.attendanceRepository.find({ where: { tenantId } }),
        this.classesRepository.find({ where: { tenantId } }),
        this.sectionsRepository.find({ where: { tenantId } }),
        // Rolling 3-month cap for high-volume tables
        this.communicationLogsRepository.find({
          where: { tenantId, createdAt: MoreThan(cutoff) },
          order: { createdAt: 'DESC' },
        }),
        this.studentDocumentsRepository.find({ where: { tenantId } }),
        this.studentTermResultsRepository.find({
          where: { tenantId, createdAt: MoreThan(cutoff) },
          order: { createdAt: 'DESC' },
        }),
        this.examGroupsRepository.find({
          where: { tenantId, createdAt: MoreThan(cutoff) },
          order: { createdAt: 'DESC' },
        }),
        this.getStudentDiscountProfiles(tenantId),
        this.feeGroupRepository.find({ where: { tenantId }, relations: ['heads'] }),
        this.carryForwardRepository.find({ where: { tenantId }, relations: ['feeHead'] }),
      ]);

    // feeHeads removed — they are embedded inside fee_groups as heads_json

    const chargeRecords = assignments.flatMap(a => mapAssignmentToTransactions(a, studentProfileMap.get(a.studentId) || null));

    const carryForwardRecords = (carryForwards || []).map((cf: CarryForward) => ({
      id: `cf_${cf.id}`,
      amount: parseFloat(cf.amount || '0'),
      type: 'charge',
      studentId: cf.studentId,
      tenantId: cf.tenantId,
      sessionId: cf.sessionId || null,
      feeGroupId: null,
      paymentMethod: 'SYSTEM',
      reference: null,
      processedBy: null,
      schoolSectionId: null,
      meta: JSON.stringify({
        feeHeadId: cf.feeHeadId || cf.id,  // Use the actual fee head ID, fall back to cf.id
        academicYear: cf.academicYear,
        isCarryForward: true,
        isFeeHead: true,
        name: 'Arrears (Brought Forward)',
        ...(cf.meta || {}),
      }),
      createdAt: cf.createdAt,
      updatedAt: new Date(),
      deletedAt: null,
    }));

    const allStudents = students.filter(s => !s.deletedAt);
    const realTransactions = transactions.filter(t => !t.deletedAt);
    const deletedStudents = students.filter(s => s.deletedAt).map(s => s.id);
    const deletedTransactions = transactions.filter(t => t.deletedAt).map(t => t.id);
    const mappedFeeGroups = (feeGroups || []).map(g => ({
      ...g,
      heads_json: JSON.stringify(
        (g.heads || []).map(h => ({
          id: h.id,
          name: h.name,
          description: h.description,
          defaultAmount: h.defaultAmount,
          isOptional: h.isOptional,
          isActive: h.isActive,
        }))
      ),
    }));

    return {
      changes: {
        students: { created: [], updated: allStudents, deleted: deletedStudents },
        fee_records: {
          created: [],
          updated: [...realTransactions, ...chargeRecords, ...carryForwardRecords],
          deleted: deletedTransactions,
        },
        attendance: { created: [], updated: attendance, deleted: [] as string[] },
        classes: { created: [], updated: classes, deleted: [] as string[] },
        sections: { created: [], updated: sections, deleted: [] as string[] },
        communication_logs: { created: [], updated: commLogs, deleted: [] as string[] },
        student_documents: { created: [], updated: docs, deleted: [] as string[] },
        student_term_results: { created: [], updated: termResults, deleted: [] as string[] },
        exam_groups: { created: [], updated: examGroups, deleted: [] as string[] },
        fee_groups: { created: [], updated: mappedFeeGroups, deleted: [] as string[] },
      },
      timestamp: Date.now(),
    };
  }

  private sanitizeRecordDates(record: any, dateFields: string[]) {
    const sanitized = { ...record };
    for (const field of dateFields) {
      if (sanitized[field] !== undefined) {
        if (sanitized[field] === 0 || sanitized[field] === '0' || sanitized[field] === null) {
          if (['createdAt', 'updatedAt', 'dob', 'admissionDate'].includes(field)) {
            delete sanitized[field];
          } else {
            sanitized[field] = null;
          }
        } else if (typeof sanitized[field] === 'number') {
          sanitized[field] = new Date(sanitized[field]);
        }
      }
    }
    return sanitized;
  }

  async pushChanges(changes: any, tenantId: string) {
    // Filter out invalid UUIDs from changes to prevent TypeORM crashes
    // This handles old 16-char WatermelonDB IDs that might be stuck in the sync queue
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const filterInvalidIds = (arr: any[]) => arr ? arr.filter(item => {
        const id = typeof item === 'string' ? item : item.id;
        if (!uuidRegex.test(id)) {
            console.warn(`[Sync] Skipping record with invalid UUID: ${id}`);
            return false;
        }
        return true;
    }) : [];

    for (const table of Object.keys(changes)) {
        if (changes[table]) {
            if (changes[table].created) changes[table].created = filterInvalidIds(changes[table].created);
            if (changes[table].updated) changes[table].updated = filterInvalidIds(changes[table].updated);
            if (changes[table].deleted) changes[table].deleted = filterInvalidIds(changes[table].deleted);
        }
    }

    // --- Students ---
    if (changes.students) {
      const { created, updated, deleted } = changes.students;
      const studentDateFields = ['dob', 'admissionDate', 'asOnDate', 'deactivatedAt', 'createdAt', 'updatedAt'];

      if (created?.length) {
        for (const record of created) {
          const sanitized = this.sanitizeRecordDates(record, studentDateFields);

          // Cast SQLite 0/1 to boolean for Postgres
          const booleanFields = [
            'hasDisability', 'hasAllergies', 'firstAidConsent', 'catholicFaithConsent',
            'isBaptized', 'isCommunicant', 'undertakingAccepted', 'parentSignature', 'isActive'
          ];
          for (const field of booleanFields) {
            if (sanitized[field] !== undefined) {
              sanitized[field] = !!sanitized[field];
            }
          }

          // Conflict Resolution: Ensure admissionNo is unique across the tenant
          let admissionNo = sanitized.admissionNo;
          let isUnique = false;
          let conflictCount = 0;

          while (!isUnique && conflictCount < 10) {
            const existing = await this.studentsRepository.findOne({ where: { admissionNo, tenantId } });
            if (existing) {
              conflictCount++;
              console.warn(`[Sync] Conflict detected for admissionNo ${admissionNo}. Regenerating...`);
              const result = await this.studentsService.getNextAdmissionNumber(sanitized.classId, tenantId);
              admissionNo = result.admissionNo;
            } else {
              isUnique = true;
            }
          }
          sanitized.admissionNo = admissionNo;

          let selectedFeeGroups: string[] | undefined;
          let feeExclusions: any;
          if (sanitized.selectedFeeGroups) {
            try { selectedFeeGroups = JSON.parse(sanitized.selectedFeeGroups); } catch { }
            delete sanitized.selectedFeeGroups;
          }
          if (sanitized.feeExclusions) {
            try { feeExclusions = JSON.parse(sanitized.feeExclusions); } catch { }
            delete sanitized.feeExclusions;
          }

          const savedStudent = await this.studentsRepository.save({ ...sanitized, tenantId });

          // Assign fees if any were selected during offline creation
          if (selectedFeeGroups && selectedFeeGroups.length > 0) {
            try {
              await this.feesService.assignFeesToStudent(savedStudent.id, selectedFeeGroups, tenantId, feeExclusions || {});
            } catch (e) {
              console.error(`[Sync] Failed to assign fees for offline student ${savedStudent.id}:`, e);
            }
          }

          // Trigger offline provisioning (user accounts & welcome emails)
          try {
            await this.studentsService.provisionNewStudentCreatedOffline(savedStudent.id, tenantId);
          } catch (e) {
            console.error(`[Sync] Failed to provision users for new offline student ${savedStudent.id}:`, e);
          }
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const sanitized = this.sanitizeRecordDates(record, studentDateFields);
          const booleanFields = [
            'hasDisability', 'hasAllergies', 'firstAidConsent', 'catholicFaithConsent',
            'isBaptized', 'isCommunicant', 'undertakingAccepted', 'parentSignature', 'isActive'
          ];
          for (const field of booleanFields) {
            if (sanitized[field] !== undefined) {
              sanitized[field] = !!sanitized[field];
            }
          }
          const existing = await this.studentsRepository.findOne({ where: { id: sanitized.id, tenantId } });
          if (existing) {
            await this.studentsRepository.save({ ...existing, ...sanitized });
          }
        }
      }

      if (deleted?.length) {
        for (const id of deleted) {
          await this.studentsRepository.softDelete({ id, tenantId });
        }
      }
    }

    // --- Fee Records (Transactions) ---
    if (changes.fee_records) {
      const { created, updated, deleted } = changes.fee_records;

      // Automatically assign the active academic session ID if the mobile app didn't send one
      let activeSessionId = null;
      if (created?.length || updated?.length) {
        const settingsList = await this.systemSettingRepository.find({ take: 1 });
        const settings = settingsList.length > 0 ? settingsList[0] : null;
        if (settings && settings.currentSessionId) {
          activeSessionId = settings.currentSessionId;
        }
      }

      if (created?.length) {
        for (const record of created) {
          const sanitized = this.sanitizeRecordDates(record, ['createdAt', 'updatedAt']);
          if (!sanitized.sessionId && activeSessionId) {
            sanitized.sessionId = activeSessionId;
          }
          // meta is stored as a JSON string in WatermelonDB but the backend column is jsonb
          if (sanitized.meta && typeof sanitized.meta === 'string') {
            try { sanitized.meta = JSON.parse(sanitized.meta); } catch { sanitized.meta = { note: sanitized.meta }; }
          }
          if (!sanitized.meta) sanitized.meta = {};

          // reference must be unique per tenant — blank it out if null/empty to avoid index conflicts
          if (!sanitized.reference) {
            sanitized.reference = null;
          }

          // ── Auto-generate fee-head allocations if the mobile app didn't send any ──
          // The website uses meta.allocations to show Fee Breakdown and PARTIAL/PAID status.
          if (!sanitized.meta?.allocations || sanitized.meta.allocations.length === 0) {
            sanitized.meta = await this.buildAllocationsFromAssignments(
              sanitized.studentId,
              tenantId,
              activeSessionId,
              parseFloat(sanitized.amount || '0'),
              sanitized.meta,
            );
          }

          await this.transactionsRepository.save({ ...sanitized, tenantId });
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const sanitized = this.sanitizeRecordDates(record, ['createdAt', 'updatedAt']);
          const existing = await this.transactionsRepository.findOne({ where: { id: sanitized.id, tenantId } });
          if (existing) {
            if (!sanitized.sessionId && existing.sessionId) {
              sanitized.sessionId = existing.sessionId;
            } else if (!sanitized.sessionId && activeSessionId) {
              sanitized.sessionId = activeSessionId;
            }
            if (sanitized.meta && typeof sanitized.meta === 'string') {
              try { sanitized.meta = JSON.parse(sanitized.meta); } catch { sanitized.meta = { note: sanitized.meta }; }
            }
            await this.transactionsRepository.save({ ...existing, ...sanitized });
          }
        }
      }

      if (deleted?.length) {
        for (const id of deleted) {
          await this.transactionsRepository.softDelete({ id, tenantId });
        }
      }
    }

    // --- Attendance ---
    if (changes.attendance) {
      const { created, updated } = changes.attendance;

      if (created?.length) {
        for (const record of created) {
          const sanitized = this.sanitizeRecordDates(record, ['date', 'createdAt', 'updatedAt']);
          await this.attendanceRepository.save({ ...sanitized, tenantId });
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const sanitized = this.sanitizeRecordDates(record, ['date', 'createdAt', 'updatedAt']);
          const existing = await this.attendanceRepository.findOne({ where: { id: sanitized.id, tenantId } });
          if (existing) {
            await this.attendanceRepository.save({ ...existing, ...sanitized });
          }
        }
      }
    }

    // --- Classes ---
    if (changes.classes) {
      const { created, updated } = changes.classes;
      if (created?.length) {
        for (const record of created) {
          const sanitized = this.sanitizeRecordDates(record, ['createdAt', 'updatedAt']);
          await this.classesRepository.save({ ...sanitized, tenantId });
        }
      }
      if (updated?.length) {
        for (const record of updated) {
          const sanitized = this.sanitizeRecordDates(record, ['createdAt', 'updatedAt']);
          const existing = await this.classesRepository.findOne({ where: { id: sanitized.id, tenantId } });
          if (existing) {
            await this.classesRepository.save({ ...existing, ...sanitized });
          }
        }
      }
    }

    // --- Sections ---
    if (changes.sections) {
      const { created, updated } = changes.sections;
      if (created?.length) {
        for (const record of created) {
          const sanitized = this.sanitizeRecordDates(record, ['createdAt', 'updatedAt']);
          await this.sectionsRepository.save({ ...sanitized, tenantId });
        }
      }
      if (updated?.length) {
        for (const record of updated) {
          const sanitized = this.sanitizeRecordDates(record, ['createdAt', 'updatedAt']);
          const existing = await this.sectionsRepository.findOne({ where: { id: sanitized.id, tenantId } });
          if (existing) {
            await this.sectionsRepository.save({ ...existing, ...sanitized });
          }
        }
      }
    }

    // NOTE: communication_logs, student_documents, student_term_results, exam_groups
    // are read-only from the mobile side — no push needed for these tables.
  }
}
