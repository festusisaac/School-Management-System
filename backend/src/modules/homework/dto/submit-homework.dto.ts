import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitHomeworkDto {
    @IsNotEmpty()
    @IsUUID()
    homeworkId!: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString({ each: true })
    attachmentUrls?: string[];
}

export class GradeSubmissionDto {
    @IsNotEmpty()
    @IsString()
    grade!: string;

    @IsOptional()
    @IsString()
    feedback?: string;
}
