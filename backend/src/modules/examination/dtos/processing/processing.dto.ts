import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ProcessResultDto {
    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsString()
    @IsNotEmpty()
    classId!: string;

    @IsBoolean()
    @IsOptional()
    recalculate?: boolean; // Force recalculation
}


export class BulkPublishDto {
    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsString()
    @IsNotEmpty()
    classId!: string;

    @IsString()
    @IsNotEmpty()
    status!: 'DRAFT' | 'PUBLISHED';
}
