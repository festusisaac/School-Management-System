import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSystemSettingDto {
    @IsUUID()
    @IsOptional()
    id?: string;

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

    @IsString()
    @IsOptional()
    schoolMotto?: string;

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
    primaryColor?: string;

    @IsString()
    @IsOptional()
    secondaryColor?: string;

    @IsString()
    @IsOptional()
    socialFacebook?: string;

    @IsString()
    @IsOptional()
    socialTwitter?: string;

    @IsString()
    @IsOptional()
    socialInstagram?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    primaryLogo?: string | null;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    favicon?: string | null;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    printLogo?: string | null;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    invoiceLogo?: string | null;

    @IsString()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    documentLogo?: string | null;

    @IsOptional()
    createdAt?: string | Date;

    @IsOptional()
    updatedAt?: string | Date;
}
