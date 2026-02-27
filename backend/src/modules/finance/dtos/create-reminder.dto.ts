import { IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class CreateReminderDto {
  @IsNotEmpty()
  studentId!: string;

  @IsNotEmpty()
  @IsISO8601()
  dueDate!: string;

  @IsOptional()
  message?: string;
}
