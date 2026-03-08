import { IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSystemSettingDto {
    // General Info
    @IsString()
    @IsOptional()
    schoolName?: string;

    @IsString()
    @IsOptional()
    schoolAddress?: string;

    @IsString()
    @IsOptional()
    schoolEmail?: string;

    @IsString()
    @IsOptional()
    schoolPhone?: string;

    // Sessions Defaults
    @IsUUID()
    @IsOptional()
    currentSessionId?: string;

    @IsUUID()
    @IsOptional()
    currentTermId?: string;

    @IsDateString()
    @IsOptional()
    sessionStartDate?: Date;

    // Localization
    @IsString()
    @IsOptional()
    dateFormat?: string;

    @IsString()
    @IsOptional()
    timezone?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    startDayOfWeek?: number;

    @IsString()
    @IsOptional()
    primaryLogo?: string;

    @IsString()
    @IsOptional()
    favicon?: string;

    @IsString()
    @IsOptional()
    printLogo?: string;

    @IsString()
    @IsOptional()
    invoiceLogo?: string;

    @IsString()
    @IsOptional()
    documentLogo?: string;
}
