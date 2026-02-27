import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
    @ApiProperty({ example: 'A', description: 'Section name (e.g., A, B, Gold, Blue)' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'uuid', description: 'ID of the class this section belongs to' })
    @IsUUID()
    @IsNotEmpty()
    classId!: string;

    @ApiProperty({ example: true, description: 'Whether the section is active', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateSectionDto {
    @ApiProperty({ example: 'B', description: 'Section name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'uuid', description: 'ID of the class this section belongs to', required: false })
    @IsUUID()
    @IsOptional()
    classId?: string;

    @ApiProperty({ example: true, description: 'Whether the section is active', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
