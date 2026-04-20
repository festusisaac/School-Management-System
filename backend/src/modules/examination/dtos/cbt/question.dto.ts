import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CbtOptionDto {
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsBoolean()
    isCorrect!: boolean;
}

export class CreateCbtQuestionDto {
    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsNumber()
    @IsOptional()
    marks?: number;

    @IsUUID()
    @IsNotEmpty()
    examId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CbtOptionDto)
    options!: CbtOptionDto[];
}

export class UpdateCbtQuestionDto {
    @IsString()
    @IsOptional()
    content?: string;

    @IsNumber()
    @IsOptional()
    marks?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CbtOptionDto)
    @IsOptional()
    options?: CbtOptionDto[];
}

export class BulkImportQuestionsDto {
    @IsUUID()
    @IsNotEmpty()
    examId!: string;

    @IsArray()
    data!: any[];
}
