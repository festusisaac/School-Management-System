import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicSession } from '@modules/system/entities/academic-session.entity';
import { SchoolSection } from '@modules/academics/entities/school-section.entity';
import { User } from '@modules/auth/entities/user.entity';
import { SystemModule } from '@modules/system/system.module';
import { ExpenseCategoriesController } from './controllers/expense-categories.controller';
import { ExpenseVendorsController } from './controllers/expense-vendors.controller';
import { ExpensesController } from './controllers/expenses.controller';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { ExpenseVendor } from './entities/expense-vendor.entity';
import { ExpenseCategoriesService } from './services/expense-categories.service';
import { ExpenseVendorsService } from './services/expense-vendors.service';
import { ExpensesService } from './services/expenses.service';

@Module({
  imports: [
    SystemModule,
    TypeOrmModule.forFeature([
      Expense,
      ExpenseCategory,
      ExpenseVendor,
      AcademicSession,
      SchoolSection,
      User,
    ]),
  ],
  controllers: [
    ExpenseCategoriesController,
    ExpenseVendorsController,
    ExpensesController,
  ],
  providers: [
    ExpenseCategoriesService,
    ExpenseVendorsService,
    ExpensesService,
  ],
  exports: [ExpensesService],
})
export class ExpensesModule {}
