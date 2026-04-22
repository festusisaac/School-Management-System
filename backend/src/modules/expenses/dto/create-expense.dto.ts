import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ExpensePaymentMethod, ExpenseStatus } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  amount!: string;

  @IsDateString()
  expenseDate!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  schoolSectionId?: string;
}

export class ExpenseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsUUID()
  schoolSectionId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
