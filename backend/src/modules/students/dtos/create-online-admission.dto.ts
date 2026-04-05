import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString } from 'class-validator';

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
    currentAddress?: string;

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
}
