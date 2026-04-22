import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { StaffStatus, EmploymentType } from '../entities/staff.entity';

export class StaffFilterDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    departmentId?: string;


    @IsEnum(StaffStatus)
    @IsOptional()
    status?: StaffStatus;

    @IsEnum(EmploymentType)
    @IsOptional()
    employmentType?: EmploymentType;

    @IsString()
    @IsOptional()
    sectionId?: string;
    
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    includeInactive?: boolean;
}
