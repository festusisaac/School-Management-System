import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssueLoanDto {
  @ApiProperty({ example: 'copy-uuid-1' })
  @IsString()
  copyId!: string;

  @ApiProperty({ example: 'student-uuid-1' })
  @IsString()
  borrowerId!: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @IsDateString()
  dueAt!: Date;
}
