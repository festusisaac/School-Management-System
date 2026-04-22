import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controllers/dashboard.controller';
import { StudentDashboardController } from './controllers/student-dashboard.controller';
import { AuditController } from './controllers/audit.controller';
import { DashboardService } from './services/dashboard.service';
import { AuditService } from './services/audit.service';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../hr/entities/staff.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { Class } from '../academics/entities/class.entity';
import { Subject } from '../academics/entities/subject.entity';
import { FeeAssignment } from '../finance/entities/fee-assignment.entity';
import { ExamResult } from '../examination/entities/exam-result.entity';
import { ExamGroup } from '../examination/entities/exam-group.entity';
import { StudentTermResult } from '../examination/entities/student-term-result.entity';
import { StaffAttendance } from '../hr/entities/staff-attendance.entity';
import { Payroll } from '../hr/entities/payroll.entity';
import { StudentAttendance } from '../students/entities/student-attendance.entity';
import { ActivityLog } from '../system/entities/activity-log.entity';
import { CommunicationLog } from '../communication/entities/communication-log.entity';
import { CarryForward } from '../finance/entities/carry-forward.entity';
import { AcademicSession } from '../system/entities/academic-session.entity';

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
      StudentTermResult,
      StaffAttendance,
      Payroll,
      StudentAttendance,
      CarryForward,
      AcademicSession,
      ActivityLog,
      CommunicationLog,
    ]),
  ],
  controllers: [DashboardController, StudentDashboardController, AuditController],
  providers: [DashboardService, AuditService],
  exports: [DashboardService, AuditService],
})
export class ReportingModule { }
