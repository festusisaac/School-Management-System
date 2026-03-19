import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, ValidateIf, IsBoolean, IsUrl } from 'class-validator';
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

    // Financial Settings
    @IsString()
    @IsOptional()
    currencySymbol?: string;

    @IsString()
    @IsOptional()
    currencyCode?: string;

    @IsString()
    @IsOptional()
    taxNumber?: string;

    @IsString()
    @IsOptional()
    invoicePrefix?: string;

    // Student & Staff Prefixes
    @IsString()
    @IsOptional()
    admissionNumberPrefix?: string;

    @IsString()
    @IsOptional()
    staffIdPrefix?: string;

    // Enhanced Contact/Social
    @IsUrl()
    @IsOptional()
    officialWebsite?: string;

    @IsString()
    @IsOptional()
    whatsappNumber?: string;

    @IsString()
    @IsOptional()
    emailFromName?: string;

    @IsUrl()
    @IsOptional()
    socialYoutube?: string;

    @IsUrl()
    @IsOptional()
    socialLinkedin?: string;

    // System/Security
    @IsBoolean()
    @IsOptional()
    isMaintenanceMode?: boolean;

    @IsNumber()
    @IsOptional()
    sessionTimeoutMinutes?: number;

    @IsNumber()
    @IsOptional()
    maxFileUploadSizeMb?: number;

    @IsOptional()
    createdAt?: string | Date;

    @IsOptional()
    updatedAt?: string | Date;
}
