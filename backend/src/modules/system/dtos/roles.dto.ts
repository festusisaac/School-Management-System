import { IsString, IsOptional, IsArray, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Academic Staff', description: 'Name of the role' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Role for all academic staff members', description: 'Description of the role' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: false, description: 'Whether this is a system-protected role' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({ example: ['uuid-1', 'uuid-2'], description: 'List of permission IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'Senior Academic Staff', description: 'Name of the role' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Updated description', description: 'Description of the role' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['uuid-1', 'uuid-3'], description: 'Updated list of permission IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds?: string[];
}
