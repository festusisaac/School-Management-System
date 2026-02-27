import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { StaffStatus } from '../entities/staff.entity';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
    @IsEnum(StaffStatus)
    @IsOptional()
    status?: StaffStatus;
}
