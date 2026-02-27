import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamGroupDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsNotEmpty()
    startDate!: string;

    @IsDateString()
    @IsNotEmpty()
    endDate!: string;

    @IsString()
    @IsNotEmpty()
    academicYear!: string;

    @IsString()
    @IsNotEmpty()
    term!: string;
}

export class CreateAssessmentTypeDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsNumber()
    maxMarks!: number;

    @IsNumber()
    @IsOptional()
    weightage?: number;

    @IsString()
    @IsOptional()
    examGroupId?: string;
}

class GradeDto {
    @IsString()
    name!: string;

    @IsNumber()
    minScore!: number;

    @IsNumber()
    maxScore!: number;

    @IsNumber()
    @IsOptional()
    gpa?: number;

    @IsString()
    @IsOptional()
    remark?: string;
}

export class CreateGradeScaleDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GradeDto)
    grades!: GradeDto[];
}

export class CreateExamDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsString()
    @IsNotEmpty()
    subjectId!: string;

    @IsString()
    @IsOptional()
    classId?: string; // Optional if exam is per subject-group, but usually per class

    @IsNumber()
    @IsOptional()
    totalMarks?: number;
}

export class CreateExamScheduleDto {
    @IsString()
    @IsNotEmpty()
    examId!: string;

    @IsDateString()
    @IsNotEmpty()
    date!: string;

    @IsString()
    @IsNotEmpty()
    startTime!: string;

    @IsString()
    @IsNotEmpty()
    endTime!: string;

    @IsString()
    @IsOptional()
    venue?: string;

    @IsString()
    @IsOptional()
    invigilatorName?: string;
}

export class CreateAdmitCardTemplateDto {
    @IsString()
    @IsNotEmpty()
    templateName!: string;

    @IsArray()
    @IsOptional()
    sections?: any[];

    @IsOptional()
    config?: any;

    @IsString()
    @IsNotEmpty()
    examGroupId!: string;
}

export class CreateDomainDto {
    @IsString()
    @IsNotEmpty()
    name!: string;
}
