import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Transaction } from '../finance/entities/transaction.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async getPullChanges(lastPulledAt: Date, tenantId: string) {
    const students = await this.studentsRepository.find({
      where: { updatedAt: MoreThan(lastPulledAt), tenantId },
      withDeleted: true,
    });

    const transactions = await this.transactionsRepository.find({
      where: { updatedAt: MoreThan(lastPulledAt), tenantId },
      withDeleted: true,
    });

    return {
      changes: {
        students: {
          created: students.filter(s => s.createdAt > lastPulledAt && !s.deletedAt),
          updated: students.filter(s => s.createdAt <= lastPulledAt && !s.deletedAt),
          deleted: students.filter(s => s.deletedAt).map(s => s.id),
        },
        transactions: {
          created: transactions.filter(t => t.createdAt > lastPulledAt && !t.deletedAt),
          updated: transactions.filter(t => t.createdAt <= lastPulledAt && !t.deletedAt),
          deleted: transactions.filter(t => t.deletedAt).map(t => t.id),
        }
      },
      timestamp: Date.now(),
    };
  }

  async pushChanges(changes: any, tenantId: string) {
    if (changes.students) {
      const { created, updated, deleted } = changes.students;
      
      for (const record of created) {
        await this.studentsRepository.save({ ...record, tenantId });
      }
      
      for (const record of updated) {
        const existing = await this.studentsRepository.findOne({ where: { id: record.id, tenantId }});
        if (existing && new Date(record.updatedAt) > existing.updatedAt) {
           await this.studentsRepository.save({ ...existing, ...record });
        }
      }
      
      for (const id of deleted) {
        await this.studentsRepository.softDelete({ id, tenantId });
      }
    }

    if (changes.transactions) {
      const { created, updated, deleted } = changes.transactions;
      
      for (const record of created) {
        await this.transactionsRepository.save({ ...record, tenantId });
      }
      
      for (const record of updated) {
        const existing = await this.transactionsRepository.findOne({ where: { id: record.id, tenantId }});
        if (existing && new Date(record.updatedAt) > existing.updatedAt) {
           await this.transactionsRepository.save({ ...existing, ...record });
        }
      }
      
      for (const id of deleted) {
        await this.transactionsRepository.softDelete({ id, tenantId });
      }
    }
  }
}
