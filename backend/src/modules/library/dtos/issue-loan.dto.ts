import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssueLoanDto {
  @ApiProperty({ example: 'copy-uuid-1' })
  @IsString()
  copyId!: string;

  @ApiProperty({ example: 'student-uuid-1', required: false })
  @IsString()
  @IsOptional()
  borrowerId?: string;

  @ApiProperty({ example: 'student-uuid-1', required: false })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ example: 'staff-uuid-1', required: false })
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @IsDateString()
  dueAt!: Date;
}
