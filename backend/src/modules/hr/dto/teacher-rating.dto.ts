import { IsString, IsNumber, IsOptional, Max, Min, IsUUID, IsDateString } from 'class-validator';

export class CreateTeacherRatingDto {
    @IsUUID()
    teacherId!: string;

    @IsString()
    academicYear!: string;

    @IsOptional()
    @IsString()
    term?: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsUUID()
    classId?: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    teachingSkills!: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    classroomManagement!: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    studentEngagement!: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    punctuality!: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    subjectKnowledge!: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    communication!: number;

    @IsOptional()
    @IsString()
    comments?: string;

    @IsDateString()
    ratingDate!: string;
}

export class UpdateTeacherRatingDto {
    @IsOptional()
    @IsString()
    academicYear?: string;

    @IsOptional()
    @IsString()
    term?: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsUUID()
    classId?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    teachingSkills?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    classroomManagement?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    studentEngagement?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    punctuality?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    subjectKnowledge?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    communication?: number;

    @IsOptional()
    @IsString()
    comments?: string;

    @IsOptional()
    @IsDateString()
    ratingDate?: string;
}
