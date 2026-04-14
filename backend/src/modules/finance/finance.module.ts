import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { FeesController } from './controllers/fees.controller';
import { FeesService } from './services/fees.service';
import { Transaction } from './entities/transaction.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { Discount } from './entities/discount.entity';
import { PaymentReminder } from './entities/payment-reminder.entity';
import { CarryForward } from './entities/carry-forward.entity';
import { Student } from '../students/entities/student.entity';
import { FeeHead } from './entities/fee-head.entity';
import { FeeGroup } from './entities/fee-group.entity';
import { DiscountProfile } from './entities/discount-profile.entity';
import { DiscountRule } from './entities/discount-rule.entity';
import { FinanceProcessor } from './processors/finance.processor';
import { StudentsModule } from '../students/students.module';
import { AcademicSession } from '../system/entities/academic-session.entity';

import { FeeAssignment } from './entities/fee-assignment.entity';

import { InternalCommunicationModule } from '../internal-communication/internal-communication.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    InternalCommunicationModule,
    SystemModule,
    forwardRef(() => StudentsModule),
    BullModule.registerQueue({
      name: 'finance',
    }),
    TypeOrmModule.forFeature([
      Transaction,
      FeeStructure,
      Discount,
      PaymentReminder,
      CarryForward,
      Student,
      FeeHead,
      FeeGroup,
      FeeAssignment,
      DiscountProfile,
      DiscountRule,
      AcademicSession,
    ]),
  ],
  controllers: [FeesController],
  providers: [FeesService, FinanceProcessor],
  exports: [FeesService, TypeOrmModule],
})
export class FinanceModule { }
