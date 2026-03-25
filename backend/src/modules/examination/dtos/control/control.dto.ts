import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveResultDto {
    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsString()
    @IsNotEmpty()
    classId!: string;

    @IsString()
    status!: string; // APPROVED, PUBLISHED
}

export class GenerateScratchCardDto {
    @IsNumber()
    @Type(() => Number)
    quantity!: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    value?: number;

    @IsString()
    @IsOptional()
    expiryDate?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    maxUsage?: number;

    @IsString()
    @IsNotEmpty()
    sessionId!: string;

    @IsString()
    @IsOptional()
    batchName?: string;

    @IsString()
    @IsOptional()
    codePrefix?: string;

    @IsString()
    @IsOptional()
    codeSuffix?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    codeLength?: number;

    @IsString()
    @IsOptional()
    codeCharset?: 'alnum' | 'numeric' | 'hex';

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    pinLength?: number;

    @IsString()
    @IsOptional()
    pinCharset?: 'alnum' | 'numeric' | 'hex';
}

export class GetScratchCardsFilterDto {
    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    batchId?: string;

    @IsString()
    @IsOptional()
    sessionId?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @IsString()
    @IsOptional()
    studentId?: string;
}

export class VerifyScratchCardDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    pin!: string;

    @IsString()
    @IsNotEmpty()
    studentId!: string;

    @IsString()
    @IsNotEmpty()
    sessionId!: string;

    @IsString()
    @IsNotEmpty()
    termId!: string;
}
