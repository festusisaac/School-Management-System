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

export class GetBroadsheetDto {
    @IsString()
    @IsNotEmpty()
    examGroupId!: string;

    @IsString()
    @IsNotEmpty()
    classId!: string;
}
