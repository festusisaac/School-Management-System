import { IsNotEmpty, IsOptional, IsNumberString } from 'class-validator';

export class CreateDiscountDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsNumberString()
  percentage!: string;

  @IsOptional()
  studentId?: string;
}
