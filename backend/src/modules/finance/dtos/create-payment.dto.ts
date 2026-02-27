import { IsNotEmpty, IsNumberString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod, TransactionType } from '../entities/transaction.entity';

export class CreatePaymentDto {
  @IsNotEmpty()
  studentId!: string;

  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  reference?: string;

  @IsOptional()
  meta?: any;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
