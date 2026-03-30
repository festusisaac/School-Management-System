import { IsString, IsArray, ValidateNested, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectTeacherAssignment {
    @IsUUID()
    subjectId!: string;

    @IsOptional()
    @IsUUID()
    teacherId?: string | null;
}

export class AssignSubjectTeachersDto {
    @IsUUID()
    classId!: string;

    @IsUUID()
    @IsOptional()
    sectionId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubjectTeacherAssignment)
    assignments!: SubjectTeacherAssignment[];
}
