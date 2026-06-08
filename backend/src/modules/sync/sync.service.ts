import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { StudentAttendance } from '../students/entities/student-attendance.entity';
import { Class } from '../academics/entities/class.entity';
import { Section } from '../academics/entities/section.entity';

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
  ) {}

  async getPullChanges(lastPulledAt: Date, tenantId: string) {
    // Fetch all records updated since last pull
    const [students, transactions, attendance, classes, sections] = await Promise.all([
      this.studentsRepository.find({
        where: { updatedAt: MoreThan(lastPulledAt), tenantId },
        withDeleted: true,
      }),
      this.transactionsRepository.find({
        where: { updatedAt: MoreThan(lastPulledAt), tenantId },
        withDeleted: true,
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
    ]);

    return {
      changes: {
        students: {
          created: students.filter(s => s.createdAt > lastPulledAt && !s.deletedAt),
          updated: students.filter(s => s.createdAt <= lastPulledAt && !s.deletedAt),
          deleted: students.filter(s => s.deletedAt).map(s => s.id),
        },
        fee_records: {
          created: transactions.filter(t => t.createdAt > lastPulledAt && !t.deletedAt),
          updated: transactions.filter(t => t.createdAt <= lastPulledAt && !t.deletedAt),
          deleted: transactions.filter(t => t.deletedAt).map(t => t.id),
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
      },
      timestamp: Date.now(),
    };
  }

  async getPullAllChanges(tenantId: string) {
    // Fetch ALL records for initial sync (no timestamp filtering)
    // Return ALL records to ensure complete data sync, let client decide created vs updated
    const [students, transactions, attendance, classes, sections] = await Promise.all([
      this.studentsRepository.find({
        where: { tenantId },
        withDeleted: true,
      }),
      this.transactionsRepository.find({
        where: { tenantId },
        withDeleted: true,
      }),
      this.attendanceRepository.find({
        where: { tenantId },
      }),
      this.classesRepository.find({
        where: { tenantId },
      }),
      this.sectionsRepository.find({
        where: { tenantId },
      }),
    ]);

    const allStudents = students.filter(s => !s.deletedAt);
    const allTransactions = transactions.filter(t => !t.deletedAt);
    const deletedStudents = students.filter(s => s.deletedAt).map(s => s.id);
    const deletedTransactions = transactions.filter(t => t.deletedAt).map(t => t.id);

    return {
      changes: {
        students: {
          // Return all records as "updated" to force them to be properly synced/overwritten
          created: [],
          updated: allStudents,
          deleted: deletedStudents,
        },
        fee_records: {
          // Same for fee records
          created: [],
          updated: allTransactions,
          deleted: deletedTransactions,
        },
        attendance: {
          created: [],
          updated: attendance,
          deleted: [] as string[],
        },
        classes: {
          created: [],
          updated: classes,
          deleted: [] as string[],
        },
        sections: {
          created: [],
          updated: sections,
          deleted: [] as string[],
        },
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

      if (created?.length) {
        for (const record of created) {
          await this.transactionsRepository.save({ ...record, tenantId });
        }
      }

      if (updated?.length) {
        for (const record of updated) {
          const existing = await this.transactionsRepository.findOne({ where: { id: record.id, tenantId } });
          if (existing && new Date(record.updatedAt) > existing.updatedAt) {
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
  }
}
