import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { Student } from '../students/entities/student.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { StudentAttendance } from '../students/entities/student-attendance.entity';
import { Class } from '../academics/entities/class.entity';
import { Section } from '../academics/entities/section.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Transaction, StudentAttendance, Class, Section]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
