import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StaffStatus, EmploymentType } from '../entities/staff.entity';

export class StaffFilterDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    departmentId?: string;

    @IsString()
    @IsOptional()
    designationId?: string;

    @IsEnum(StaffStatus)
    @IsOptional()
    status?: StaffStatus;

    @IsEnum(EmploymentType)
    @IsOptional()
    employmentType?: EmploymentType;
}
