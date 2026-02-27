import { IsUUID, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateClassSubjectDto {
    @IsUUID()
    classId!: string;

    @IsUUID()
    @IsOptional()
    sectionId?: string;

    @IsUUID()
    subjectId!: string;

    @IsBoolean()
    @IsOptional()
    isCore?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class BulkAssignClassSubjectsDto {
    @IsUUID()
    classId!: string;

    @IsUUID()
    @IsOptional()
    sectionId?: string;

    @IsArray()
    @IsUUID(undefined, { each: true })
    subjectIds!: string[];

    @IsBoolean()
    @IsOptional()
    isCore?: boolean;
}

export class UpdateClassSubjectDto {
    @IsBoolean()
    @IsOptional()
    isCore?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
