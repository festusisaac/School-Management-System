import { Injectable } from '@nestjs/common';
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

function computeChargeAmount(assignment: FeeAssignment, discountProfile: any | null): string {
  if (!assignment.feeGroup || !assignment.feeGroup.heads) return '0.00';
  let total = 0;
  for (const head of assignment.feeGroup.heads) {
    if (!assignment.excludedHeadIds?.includes(head.id)) {
      total += calculateDiscountedAmount(head.defaultAmount || '0', head.id, discountProfile);
    }
  }
  return total.toFixed(2);
}

function mapAssignmentToTransaction(assignment: FeeAssignment, discountProfile: any | null): any {
  return {
    id: assignment.id,
    amount: computeChargeAmount(assignment, discountProfile),
    type: 'charge',
    studentId: assignment.studentId,
    tenantId: assignment.tenantId,
    sessionId: assignment.sessionId || null,
    feeGroupId: assignment.feeGroupId || null,
    paymentMethod: 'SYSTEM',
    reference: null,
    processedBy: null,
    schoolSectionId: null,
    meta: assignment.feeGroup ? { feeGroupName: assignment.feeGroup.name } : null,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    deletedAt: null,
  };
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
  ) {}

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

    const [students, transactions, assignments, attendance, classes, sections, commLogs, docs, termResults, examGroups, studentProfileMap] =
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
        this.feeAssignmentsRepository.find({
          where: { updatedAt: MoreThan(lastPulledAt), tenantId },
          relations: ['feeGroup', 'feeGroup.heads'],
        }),
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
      ]);

    // Charge records are synthetic and never exist locally — always send as 'created'
    const chargeRecords = assignments.map(a => mapAssignmentToTransaction(a, studentProfileMap.get(a.studentId) || null));
    const realTransactions = transactions;

    return {
      changes: {
        students: {
          created: students.filter(s => s.createdAt > lastPulledAt && !s.deletedAt),
          updated: students.filter(s => s.createdAt <= lastPulledAt && !s.deletedAt),
          deleted: students.filter(s => s.deletedAt).map(s => s.id),
        },
        fee_records: {
          // Real transactions ALWAYS go in 'updated' — WatermelonDB will upsert them safely.
          // This prevents the "server wants to create but already exists" conflict when the mobile
          // pushes an offline record and then receives it back in the same sync pull.
          created: [...chargeRecords], // only synthetic charge records go in 'created'
          updated: realTransactions.filter(t => !t.deletedAt),
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
          created: examGroups.filter(g => g.createdAt > lastPulledAt),
          updated: examGroups.filter(g => g.createdAt <= lastPulledAt),
          deleted: [] as string[],
        },
      },
      timestamp: Date.now(),
    };
  }

  async getPullAllChanges(tenantId: string) {
    const cutoff = threeMonthsAgo();

    const [students, transactions, assignments, attendance, classes, sections, commLogs, docs, termResults, examGroups, studentProfileMap] =
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
      ]);

    // Charge records are synthetic and never exist locally — always send as 'created'
    const chargeRecords = assignments.map(a => mapAssignmentToTransaction(a, studentProfileMap.get(a.studentId) || null));

    const allStudents = students.filter(s => !s.deletedAt);
    const realTransactions = transactions.filter(t => !t.deletedAt);
    const deletedStudents = students.filter(s => s.deletedAt).map(s => s.id);
    const deletedTransactions = transactions.filter(t => t.deletedAt).map(t => t.id);

    return {
      changes: {
        students: { created: [], updated: allStudents, deleted: deletedStudents },
        fee_records: {
          created: chargeRecords, // synthetic charge records always go in 'created'
          updated: realTransactions,
          deleted: deletedTransactions,
        },
        attendance: { created: [], updated: attendance, deleted: [] as string[] },
        classes: { created: [], updated: classes, deleted: [] as string[] },
        sections: { created: [], updated: sections, deleted: [] as string[] },
        // Rolling window — return all as "updated" so client upserts cleanly
        communication_logs: { created: [], updated: commLogs, deleted: [] as string[] },
        student_documents: { created: [], updated: docs, deleted: [] as string[] },
        student_term_results: { created: [], updated: termResults, deleted: [] as string[] },
        exam_groups: { created: [], updated: examGroups, deleted: [] as string[] },
      },
      timestamp: Date.now(),
    };
  }

  async pushChanges(changes: any, tenantId: string) {
    // --- Students ---
    if (changes.students) {
      const { created, updated, deleted } = changes.students;

      if (created?.length) {
        for (const record of created) {
          await this.studentsRepository.save({ ...record, tenantId });
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const existing = await this.studentsRepository.findOne({ where: { id: record.id, tenantId } });
          if (existing && new Date(record.updatedAt) > existing.updatedAt) {
            await this.studentsRepository.save({ ...existing, ...record });
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
          if (!record.sessionId && activeSessionId) {
            record.sessionId = activeSessionId;
          }
          // meta is stored as a JSON string in WatermelonDB but the backend column is jsonb
          if (record.meta && typeof record.meta === 'string') {
            try { record.meta = JSON.parse(record.meta); } catch { record.meta = { note: record.meta }; }
          }
          if (!record.meta) record.meta = {};

          // reference must be unique per tenant — blank it out if null/empty to avoid index conflicts
          if (!record.reference) {
            record.reference = null;
          }

          // ── Auto-generate fee-head allocations if the mobile app didn't send any ──
          // The website uses meta.allocations to show Fee Breakdown and PARTIAL/PAID status.
          if (!record.meta?.allocations || record.meta.allocations.length === 0) {
            record.meta = await this.buildAllocationsFromAssignments(
              record.studentId,
              tenantId,
              activeSessionId,
              parseFloat(record.amount || '0'),
              record.meta,
            );
          }

          await this.transactionsRepository.save({ ...record, tenantId });
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const existing = await this.transactionsRepository.findOne({ where: { id: record.id, tenantId } });
          if (existing && new Date(record.updatedAt) > existing.updatedAt) {
            if (!record.sessionId && existing.sessionId) {
              record.sessionId = existing.sessionId;
            } else if (!record.sessionId && activeSessionId) {
              record.sessionId = activeSessionId;
            }
            if (record.meta && typeof record.meta === 'string') {
              try { record.meta = JSON.parse(record.meta); } catch { record.meta = { note: record.meta }; }
            }
            await this.transactionsRepository.save({ ...existing, ...record });
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
          await this.attendanceRepository.save({ ...record, tenantId });
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const existing = await this.attendanceRepository.findOne({ where: { id: record.id, tenantId } });
          if (existing && new Date(record.updatedAt) > existing.updatedAt) {
            await this.attendanceRepository.save({ ...existing, ...record });
          }
        }
      }
    }

    // --- Classes ---
    if (changes.classes) {
      const { created, updated } = changes.classes;
      if (created?.length) {
        for (const record of created) {
          await this.classesRepository.save({ ...record, tenantId });
        }
      }
      if (updated?.length) {
        for (const record of updated) {
          const existing = await this.classesRepository.findOne({ where: { id: record.id, tenantId } });
          if (existing && new Date(record.updatedAt) > existing.updatedAt) {
            await this.classesRepository.save({ ...existing, ...record });
          }
        }
      }
    }

    // --- Sections ---
    if (changes.sections) {
      const { created, updated } = changes.sections;
      if (created?.length) {
        for (const record of created) {
          await this.sectionsRepository.save({ ...record, tenantId });
        }
      }
      if (updated?.length) {
        for (const record of updated) {
          const existing = await this.sectionsRepository.findOne({ where: { id: record.id, tenantId } });
          if (existing && new Date(record.updatedAt) > existing.updatedAt) {
            await this.sectionsRepository.save({ ...existing, ...record });
          }
        }
      }
    }

    // NOTE: communication_logs, student_documents, student_term_results, exam_groups
    // are read-only from the mobile side — no push needed for these tables.
  }
}
