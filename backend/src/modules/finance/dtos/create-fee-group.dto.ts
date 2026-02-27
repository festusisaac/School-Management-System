import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateFeeGroupDto {
    @IsString()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsUUID('all', { each: true })
    headIds!: string[];
}
