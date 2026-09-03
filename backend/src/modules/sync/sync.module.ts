import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
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
import { CarryForward } from '../finance/entities/carry-forward.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { StudentsModule } from '../students/students.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    forwardRef(() => StudentsModule),
    forwardRef(() => FinanceModule),
    TypeOrmModule.forFeature([
      Student,
      Transaction,
      StudentAttendance,
      Class,
      Section,
      CommunicationLog,
      StudentDocument,
      StudentTermResult,
      ExamGroup,
      FeeAssignment,
      DiscountProfile,
      SystemSetting,
      FeeGroup,
      FeeHead,
      CarryForward,
      Expense,
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule { }
