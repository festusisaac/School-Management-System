import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

import { FeeAssignment } from './entities/fee-assignment.entity';

import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    CommunicationModule,
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
    ]),
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService, TypeOrmModule],
})
export class FinanceModule { }
