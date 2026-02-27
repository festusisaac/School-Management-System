import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional } from 'class-validator';

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
    count!: number; // e.g. 50 cards

    @IsNumber()
    @IsOptional()
    maxUsage?: number;
}
