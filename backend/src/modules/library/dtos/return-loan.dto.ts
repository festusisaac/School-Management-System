import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnLoanDto {
  @ApiProperty({ example: 'loan-uuid-1' })
  @IsString()
  loanId!: string;

  @ApiProperty({ example: '2026-04-05T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  returnedAt?: Date;
}
