import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEmail, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDonationProjectDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  goalAmount!: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  bannerImage?: string;
}

export class UpdateDonationProjectDto extends CreateDonationProjectDto {}

export class InitiateDonationDto {
  @IsString()
  @IsNotEmpty()
  donorName!: string;

  @IsEmail()
  @IsNotEmpty()
  donorEmail!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsEnum(['paystack', 'flutterwave'])
  gateway!: 'paystack' | 'flutterwave';

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class VerifyDonationDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsEnum(['paystack', 'flutterwave'])
  gateway!: 'paystack' | 'flutterwave';

  @IsOptional()
  @IsString()
  tenantId?: string;
}
