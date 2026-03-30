import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './controllers/students.controller';
import { StudentsService } from './services/students.service';
import { Student } from './entities/student.entity';
import { StudentCategory } from './entities/student-category.entity';
import { StudentHouse } from './entities/student-house.entity';
import { DeactivateReason } from './entities/deactivate-reason.entity';
import { OnlineAdmission } from './entities/online-admission.entity';
import { Parent } from './entities/parent.entity';
import { StudentDocument } from './entities/student-document.entity';
import { StudentAttendance } from './entities/student-attendance.entity';
import { Role } from '../auth/entities/role.entity';
import { FinanceModule } from '../finance/finance.module';
import { SystemModule } from '../system/system.module';
import { CommunicationModule } from '../communication/communication.module';
import { BullModule } from '@nestjs/bull';
import { StudentImportProcessor } from './processors/student-import.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Parent,
      StudentDocument,
      StudentCategory,
      StudentHouse,
      DeactivateReason,
      OnlineAdmission,
      StudentAttendance,
      Role
    ]),
    FinanceModule,
    SystemModule,
    CommunicationModule,
    BullModule.registerQueue({
      name: 'student-import',
    }),
  ],
  controllers: [StudentsController],
  providers: [StudentsService, StudentImportProcessor],
  exports: [StudentsService, TypeOrmModule],
})
export class StudentsModule { }
