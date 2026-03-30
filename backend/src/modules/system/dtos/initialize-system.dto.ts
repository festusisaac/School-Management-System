import { IsEmail, IsNotEmpty, IsString, MinLength, IsDateString, IsOptional, IsUrl } from 'class-validator';

export class InitializeSystemDto {
  // --- Step 1: School Branding & Info ---
  @IsString()
  @IsNotEmpty()
  schoolName!: string;

  @IsString()
  @IsOptional()
  schoolMotto?: string;

  @IsString()
  @IsNotEmpty()
  schoolAddress!: string;

  @IsEmail()
  schoolEmail!: string;

  @IsString()
  @IsNotEmpty()
  schoolPhone!: string;

  @IsOptional()
  @IsString()
  officialWebsite?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  // --- Step 2: Admin Account ---
  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty()
  adminLastName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  adminPassword!: string;

  // --- Step 3: Academic Setup ---
  @IsString()
  @IsNotEmpty()
  sessionName!: string;

  @IsDateString()
  @IsNotEmpty()
  sessionStartDate!: string;

  @IsDateString()
  @IsNotEmpty()
  sessionEndDate!: string;

  @IsString()
  @IsNotEmpty()
  termName!: string;

  @IsDateString()
  @IsNotEmpty()
  termStartDate!: string;

  @IsDateString()
  @IsNotEmpty()
  termEndDate!: string;

  // --- Step 4: Regional & ID Formats ---
  @IsString()
  @IsNotEmpty()
  timezone!: string;

  @IsString()
  @IsNotEmpty()
  dateFormat!: string;

  @IsString()
  @IsNotEmpty()
  admissionNumberPrefix!: string;

  @IsString()
  @IsNotEmpty()
  staffIdPrefix!: string;
}
