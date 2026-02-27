import { IsString, IsOptional, IsNumberString, IsBoolean } from 'class-validator';

export class CreateFeeHeadDto {
    @IsString()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumberString()
    @IsOptional()
    defaultAmount?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isOptional?: boolean;
}
