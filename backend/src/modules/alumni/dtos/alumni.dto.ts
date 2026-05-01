import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUrl, IsUUID, IsEmail, IsDateString, ValidateIf } from 'class-validator';

export class CreateAlumniDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsNumber()
  @IsNotEmpty()
  graduationYear!: number;

  @IsString()
  @IsOptional()
  currentOccupation?: string;

  @IsString()
  @IsOptional()
  currentCompany?: string;

  @ValidateIf(o => o.linkedInUrl !== '' && o.linkedInUrl !== null)
  @IsUrl()
  @IsOptional()
  linkedInUrl?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  achievements?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  isMentorshipAvailable?: boolean;
}

export class UpdateAlumniDto extends CreateAlumniDto {}

export class GraduateStudentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsNumber()
  @IsNotEmpty()
  graduationYear!: number;

  @IsString()
  @IsOptional()
  currentOccupation?: string;

  @IsString()
  @IsOptional()
  currentCompany?: string;

  @IsOptional()
  isMentorshipAvailable?: boolean;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class BulkGraduateStudentsDto {
  @IsNotEmpty()
  studentIds!: string[];

  @IsNumber()
  @IsNotEmpty()
  graduationYear!: number;
}

export class CreateAlumniEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  eventDate!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  sendNotification?: boolean;

  @IsOptional()
  @IsNumber()
  targetGraduationYear?: number;
}

export class UpdateAlumniEventDto extends CreateAlumniEventDto {}
