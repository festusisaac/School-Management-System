import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MarkEntryDto {
    @IsString()
    @IsNotEmpty()
    studentId!: string;

    @IsNumber()
    @IsNotEmpty()
    score!: number;

    @IsString()
    @IsOptional()
    status?: string; // PRESENT, ABSENT
}

export class SaveMarksDto {
    @IsString()
    @IsNotEmpty()
    examId!: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    assessmentTypeId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MarkEntryDto)
    marks!: MarkEntryDto[];
}

class SkillEntryDto {
    @IsString()
    @IsNotEmpty()
    studentId!: string;

    @IsString()
    @IsNotEmpty()
    domainId!: string;

    @IsString()
    @IsNotEmpty()
    rating!: string;
}

export class SaveSkillsDto {
    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SkillEntryDto)
    skills!: SkillEntryDto[];
}

class PsychomotorEntryDto {
    @IsString()
    @IsNotEmpty()
    studentId!: string;

    @IsString()
    @IsNotEmpty()
    domainId!: string;

    @IsString()
    @IsNotEmpty()
    rating!: string;
}

export class SavePsychomotorDto {
    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PsychomotorEntryDto)
    ratings!: PsychomotorEntryDto[];
}
