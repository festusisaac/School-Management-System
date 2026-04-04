import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../hr/entities/staff.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { Class } from '../academics/entities/class.entity';
import { Subject } from '../academics/entities/subject.entity';
import { FeeAssignment } from '../finance/entities/fee-assignment.entity';
import { ExamResult } from '../examination/entities/exam-result.entity';
import { ExamGroup } from '../examination/entities/exam-group.entity';
import { StaffAttendance } from '../hr/entities/staff-attendance.entity';
import { Payroll } from '../hr/entities/payroll.entity';
import { StudentAttendance } from '../students/entities/student-attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Staff,
      Transaction,
      Class,
      Subject,
      FeeAssignment,
      ExamResult,
      ExamGroup,
      StaffAttendance,
      Payroll,
      StudentAttendance,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class ReportingModule { }
