import { IsNotEmpty, IsUUID, IsEnum, IsDateString, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, AttendanceSource } from '../entities/staff-attendance.entity';

export class MarkAttendanceDto {
    @IsNotEmpty()
    @IsUUID()
    staffId!: string;

    @IsNotEmpty()
    @IsDateString()
    date!: string;

    @IsNotEmpty()
    @IsEnum(AttendanceStatus)
    status!: AttendanceStatus;

    @IsOptional()
    @IsString()
    checkInTime?: string;

    @IsOptional()
    @IsString()
    checkOutTime?: string;

    @IsOptional()
    @IsEnum(AttendanceSource)
    source?: AttendanceSource;

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class BulkMarkAttendanceDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MarkAttendanceDto)
    attendance!: MarkAttendanceDto[];
}
