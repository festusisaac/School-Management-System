import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CreateOnlineAdmissionDto {
    @IsString()
    @IsNotEmpty()
    firstName!: string;

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
    preferredClassId?: string;
}
