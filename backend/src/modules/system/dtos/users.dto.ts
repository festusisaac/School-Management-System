import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@sms.school' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: 'uuid-of-role' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'uuid-of-role' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  role?: string;

  @ApiPropertyOptional()
  roleId?: string;

  @ApiPropertyOptional()
  roleObject?: any;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
