import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentHouseDto {
    @IsString()
    @IsNotEmpty()
    houseName!: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateStudentHouseDto {
    @IsString()
    @IsNotEmpty()
    houseName!: string;

    @IsString()
    @IsOptional()
    description?: string;
}
