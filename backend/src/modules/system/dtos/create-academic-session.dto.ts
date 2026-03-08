import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAcademicSessionDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsDateString()
    @IsOptional()
    startDate?: Date;

    @IsDateString()
    @IsOptional()
    endDate?: Date;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
