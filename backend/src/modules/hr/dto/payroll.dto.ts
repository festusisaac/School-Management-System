import { IsString, IsNumber, IsUUID, IsOptional, IsEnum, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PayrollStatus } from '../entities/payroll.entity';

class SalaryComponent {
    @IsString()
    name!: string;

    @IsNumber()
    @Min(0)
    amount!: number;
}

export class CreatePayrollDto {
    @IsUUID()
    staffId!: string;

    @IsNumber()
    @Min(1)
    @Max(12)
    month!: number;

    @IsNumber()
    @Min(2000)
    year!: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    basicSalary?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalaryComponent)
    allowances?: SalaryComponent[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalaryComponent)
    deductions?: SalaryComponent[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    workingDays?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    presentDays?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    absentDays?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    leaveDays?: number;

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class BulkCreatePayrollDto {
    @IsNumber()
    @Min(1)
    @Max(12)
    month!: number;

    @IsNumber()
    @Min(2000)
    year!: number;
}

export class UpdatePayrollStatusDto {
    @IsEnum(PayrollStatus)
    status!: PayrollStatus;

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @IsOptional()
    @IsString()
    paymentDate?: string;
}
