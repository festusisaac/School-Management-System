import { IsString, IsNotEmpty, IsUUID, IsDateString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateAcademicTermDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsUUID()
    @IsNotEmpty()
    sessionId!: string;

    @IsDateString()
    @IsOptional()
    startDate?: Date;

    @IsDateString()
    @IsOptional()
    endDate?: Date;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsNumber()
    @IsOptional()
    daysOpened?: number;

    @IsDateString()
    @IsOptional()
    nextTermStartDate?: Date;
}
