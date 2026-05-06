import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOnlineAdmissionDto {
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @IsString()
    @IsOptional()
    middleName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsNotEmpty()
    gender!: string;

    @IsDateString()
    @IsNotEmpty()
    dob!: string;

    @IsString()
    @IsOptional()
    religion?: string;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsString()
    @IsOptional()
    genotype?: string;

    @IsString()
    @IsOptional()
    stateOfOrigin?: string;

    @IsString()
    @IsOptional()
    nationality?: string;

    @IsString()
    @IsOptional()
    mobileNumber?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsEmail()
    @IsNotEmpty()
    guardianEmail!: string;

    @IsString()
    @IsOptional()
    guardianPhoto?: string;

    @IsString()
    @IsNotEmpty()
    guardianName!: string;

    @IsString()
    @IsNotEmpty()
    guardianPhone!: string;

    @IsString()
    @IsNotEmpty()
    guardianRelation!: string;

    @IsString()
    @IsOptional()
    fatherName?: string;

    @IsString()
    @IsOptional()
    fatherPhone?: string;

    @IsEmail()
    @IsOptional()
    fatherEmail?: string;

    @IsString()
    @IsOptional()
    fatherOccupation?: string;

    @IsString()
    @IsOptional()
    motherName?: string;

    @IsString()
    @IsOptional()
    motherPhone?: string;

    @IsEmail()
    @IsOptional()
    motherEmail?: string;

    @IsString()
    @IsOptional()
    motherOccupation?: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @IsString()
    @IsOptional()
    currentAddress?: string;

    @IsString()
    @IsOptional()
    permanentAddress?: string;

    @IsString()
    @IsOptional()
    previousSchoolName?: string;

    @IsString()
    @IsOptional()
    lastClassPassed?: string;

    @IsString()
    @IsOptional()
    medicalConditions?: string;

    @IsString()
    @IsOptional()
    preferredClassId?: string;

    @IsString()
    @IsOptional()
    transactionReference?: string;

    // Medical & Health Records
    @IsString()
    @IsOptional()
    specialPhysicalHealthProblems?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    hasDisability?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    hasAllergies?: boolean;

    @IsString()
    @IsOptional()
    allergyDetails?: string;

    @IsString()
    @IsOptional()
    familyDoctorName?: string;

    @IsString()
    @IsOptional()
    familyDoctorClinicAddress?: string;

    @IsString()
    @IsOptional()
    familyDoctorPhone?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    firstAidConsent?: boolean;

    // Faith & Religious Participation
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    catholicFaithConsent?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    isBaptized?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    isCommunicant?: boolean;

    // Legal & Finalization
    @IsString()
    @IsOptional()
    applicationFeeReference?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    undertakingAccepted?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    parentSignature?: boolean;

    @IsOptional()
    documentTitles?: string | string[];
}
