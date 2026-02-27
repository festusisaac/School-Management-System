import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../hr/entities/staff.entity';
import { Transaction } from '../finance/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Staff, Transaction]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class ReportingModule { }
