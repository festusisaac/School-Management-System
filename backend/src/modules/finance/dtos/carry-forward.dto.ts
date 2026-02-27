import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

// Updated DTO to support auto-calculation of balance
export class CarryForwardDto {
  @IsNotEmpty()
  studentId!: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsNotEmpty()
  academicYear!: string;
}
