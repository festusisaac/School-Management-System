import { IsString, IsOptional, IsNotEmpty, IsDateString, IsEmail } from 'class-validator';

export class CreateStudentDto {
    @IsString()
    @IsNotEmpty()
    admissionNo!: string;

    @IsString()
    @IsOptional()
    rollNo?: string;

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
    dob!: Date;

    @IsString()
    @IsOptional()
    religion?: string;

    @IsString()
    @IsOptional()
    caste?: string;

    @IsString()
    @IsOptional()
    mobileNumber?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsDateString()
    @IsNotEmpty()
    admissionDate!: Date;

    @IsString()
    @IsOptional()
    studentPhoto?: string;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsString()
    @IsOptional()
    height?: string;

    @IsString()
    @IsOptional()
    weight?: string;

    @IsDateString()
    @IsOptional()
    asOnDate?: Date;

    @IsString()
    @IsOptional()
    classId?: string;

    @IsString()
    @IsOptional()
    sectionId?: string;

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsOptional()
    houseId?: string;

    @IsString()
    @IsOptional()
    fatherName?: string;

    @IsString()
    @IsOptional()
    fatherPhone?: string;

    @IsString()
    @IsOptional()
    fatherOccupation?: string;

    @IsString()
    @IsOptional()
    motherName?: string;

    @IsString()
    @IsOptional()
    motherPhone?: string;

    @IsString()
    @IsOptional()
    motherOccupation?: string;

    @IsString()
    @IsOptional()
    guardianName?: string;

    @IsString()
    @IsOptional()
    guardianRelation?: string;

    @IsString()
    @IsOptional()
    guardianPhone?: string;

    @IsEmail()
    @IsOptional()
    guardianEmail?: string;

    @IsString()
    @IsOptional()
    guardianAddress?: string;

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
    transportRoute?: string;

    @IsString()
    @IsOptional()
    vehicleNumber?: string;

    @IsString()
    @IsOptional()
    pickupPoint?: string;

    @IsString()
    @IsOptional()
    hostelName?: string;

    @IsString()
    @IsOptional()
    roomNumber?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    discountProfileId?: string;

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
    nationality?: string;

    @IsString()
    @IsOptional()
    stateOfOrigin?: string;

    @IsString()
    @IsOptional()
    genotype?: string;

    @IsString()
    @IsOptional()
    siblingId?: string;

    @IsString()
    @IsOptional()
    parentId?: string;

    @IsOptional()
    documentTitles?: string | string[];

    @IsOptional()
    feeGroupIds?: string[];

    @IsString()
    @IsOptional()
    session?: string;

    @IsOptional()
    feeExclusions?: Record<string, string[]>; // Map<FeeGroupId, ExcludedHeadIds[]>

    @IsOptional()
    mustChangePassword?: boolean;
}
