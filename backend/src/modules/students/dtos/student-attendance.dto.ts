import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../entities/student-attendance.entity';

export class MarkAttendanceDto {
  @IsUUID()
  studentId!: string;

  @IsDateString()
  date!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
  
  @IsUUID()
  classId!: string;
  
  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class BulkMarkAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceDto)
  records!: MarkAttendanceDto[];
}

