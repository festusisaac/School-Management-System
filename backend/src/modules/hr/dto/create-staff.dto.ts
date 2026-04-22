import { IsString, IsEmail, IsEnum, IsOptional, IsDate, IsDateString, IsNumber, IsArray, MinLength, MaxLength, Matches, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EmploymentType, Gender, StaffStatus, MaritalStatus } from '../entities/staff.entity';

export class CreateStaffDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    employeeId!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    lastName!: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dateOfBirth?: Date;

    @IsEnum(Gender)
    gender!: Gender;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsOptional()
    @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
        message: 'Phone number must be valid',
    })
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsString()
    @IsOptional()
    emergencyContactName?: string;

    @IsString()
    @IsOptional()
    emergencyContactPhone?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 'on') return true;
        if (value === 'false' || value === false || value === '' || value === null) return false;
        return value;
    })
    @IsBoolean()
    isTeachingStaff?: boolean;

    @IsString()
    @IsOptional()
    emergencyContactRelation?: string;

    @IsDate()
    @Type(() => Date)
    dateOfJoining!: Date;

    @IsString()
    @IsOptional()
    departmentId?: string;

    @IsEnum(EmploymentType)
    employmentType!: EmploymentType;

    @IsString()
    @IsOptional()
    bankName?: string;

    @IsString()
    @IsOptional()
    accountTitle?: string;

    @IsString()
    @IsOptional()
    accountNumber?: string;

    @IsNumber()
    @Type(() => Number)
    basicSalary!: number;

    @IsString()
    @IsOptional()
    qualifications?: string;

    @IsString()
    @IsOptional()
    biometricId?: string;

    // --- Extended Fields ---
    @IsString()
    @IsOptional()
    role?: string;

    @IsString()
    @IsOptional()
    roleId?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true || value === 'on') return true;
        if (value === 'false' || value === false || value === '' || value === null) return false;
        return value;
    })
    @IsBoolean()
    enableLogin?: boolean;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : value)
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    fatherName?: string;

    @IsString()
    @IsOptional()
    motherName?: string;

    @IsEnum(MaritalStatus)
    @IsOptional()
    maritalStatus?: MaritalStatus;

    @IsString()
    @IsOptional()
    permanentAddress?: string;

    @IsString()
    @IsOptional()
    workExperience?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    facebookUrl?: string;

    @IsString()
    @IsOptional()
    twitterUrl?: string;

    @IsString()
    @IsOptional()
    linkedinUrl?: string;

    @IsString()
    @IsOptional()
    instagramUrl?: string;

    @IsString()
    @IsOptional()
    signature?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    sectionIds?: string[];
}
