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
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Parent,
      StudentDocument,
      StudentCategory,
      StudentHouse,
      DeactivateReason,
      OnlineAdmission
    ]),
    FinanceModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService, TypeOrmModule],
})
export class StudentsModule { }
