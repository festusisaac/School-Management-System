import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateHomeworkDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsNotEmpty()
    dueDate!: string;

    @IsUUID()
    @IsNotEmpty()
    classId!: string;

    @IsUUID()
    @IsNotEmpty()
    subjectId!: string;

    @IsUUID()
    @IsNotEmpty()
    teacherId!: string;

    @IsString()
    @IsOptional()
    attachmentUrl?: string;
}
