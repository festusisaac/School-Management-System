import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

export class CreateLessonNoteDto {
    @IsUUID()
    subjectId!: string;

    @IsUUID()
    classId!: string;

    @IsUUID()
    @IsOptional()
    termId?: string;

    @IsUUID()
    @IsOptional()
    sessionId?: string;

    @IsString()
    topic!: string;

    @IsString()
    @IsOptional()
    duration?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    content?: string;
}

export class UpdateLessonNoteDto {
    @IsUUID()
    @IsOptional()
    subjectId?: string;

    @IsUUID()
    @IsOptional()
    classId?: string;

    @IsUUID()
    @IsOptional()
    termId?: string;

    @IsUUID()
    @IsOptional()
    sessionId?: string;

    @IsString()
    @IsOptional()
    topic?: string;

    @IsString()
    @IsOptional()
    duration?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsEnum(['draft', 'submitted', 'approved', 'rejected'])
    @IsOptional()
    status?: 'draft' | 'submitted' | 'approved' | 'rejected';

    @IsString()
    @IsOptional()
    reviewNotes?: string;
}

export class LessonNoteFilterDto {
    @IsUUID()
    @IsOptional()
    subjectId?: string;

    @IsUUID()
    @IsOptional()
    classId?: string;

    @IsUUID()
    @IsOptional()
    teacherId?: string;

    @IsEnum(['draft', 'submitted', 'approved', 'rejected'])
    @IsOptional()
    status?: string;

    @IsUUID()
    @IsOptional()
    termId?: string;

    @IsUUID()
    @IsOptional()
    sessionId?: string;
}
