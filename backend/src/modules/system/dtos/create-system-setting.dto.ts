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
    @ValidateIf((o, v) => v !== null)
    currentSessionId?: string | null;

    @IsUUID()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    currentTermId?: string | null;

    @IsDateString()
    @IsOptional()
    @ValidateIf((o, v) => v !== '' && v !== null)
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

    // Identification Prefixes
    @IsString()
    @IsOptional()
    admissionNumberPrefix?: string;

    @IsString()
    @IsOptional()
    staffIdPrefix?: string;

    // Enhanced Contact/Social
    @IsString()
    @IsOptional()
    officialWebsite?: string;

    @IsString()
    @IsOptional()
    whatsappNumber?: string;

    @IsString()
    @IsOptional()
    emailFromName?: string;

    @IsString()
    @IsOptional()
    socialYoutube?: string;

    @IsString()
    @IsOptional()
    socialLinkedin?: string;

    // System/Security
    @IsBoolean()
    @IsOptional()
    isMaintenanceMode?: boolean;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    sessionTimeoutMinutes?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    maxFileUploadSizeMb?: number;

    @IsOptional()
    createdAt?: string | Date;

    @IsOptional()
    updatedAt?: string | Date;
}
