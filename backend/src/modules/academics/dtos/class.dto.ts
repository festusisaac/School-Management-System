import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
    @ApiProperty({ example: 'JSS1', description: 'Class name (e.g., JSS1, SS2, Grade 10)' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: true, description: 'Whether the class is active', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ example: 'uuid', description: 'ID of the school section', required: false })
    @IsUUID()
    @IsOptional()
    schoolSectionId?: string;
}

export class UpdateClassDto {
    @ApiProperty({ example: 'JSS1', description: 'Class name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: true, description: 'Whether the class is active', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ example: 'uuid', description: 'ID of the school section', required: false })
    @IsUUID()
    @IsOptional()
    schoolSectionId?: string;
}
