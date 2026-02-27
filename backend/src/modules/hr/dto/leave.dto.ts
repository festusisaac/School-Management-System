import { IsNotEmpty, IsString, IsInt, IsBoolean, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateLeaveTypeDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    code!: string;

    @IsNotEmpty()
    @IsInt()
    maxDays!: number;

    @IsBoolean()
    isPaid!: boolean;

    @IsBoolean()
    requiresApproval!: boolean;

    @IsBoolean()
    requiresDocument!: boolean;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateLeaveTypeDto extends CreateLeaveTypeDto { }

export class CreateLeaveRequestDto {
    @IsNotEmpty()
    @IsUUID()
    leaveTypeId!: string;

    @IsNotEmpty()
    @IsDateString()
    startDate!: string;

    @IsNotEmpty()
    @IsDateString()
    endDate!: string;

    @IsNotEmpty()
    @IsString()
    reason!: string;
}
