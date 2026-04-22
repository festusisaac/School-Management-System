import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@sms.school or STAFF/001' })
  @IsString()
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

  @ApiPropertyOptional({ example: '/uploads/students/profile.jpg' })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  mustChangePassword?: boolean;
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
  @Transform(({ value }) => value === '' ? undefined : value)
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ example: '/uploads/students/profile.jpg' })
  @IsString()
  @IsOptional()
  photo?: string;
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

  @ApiPropertyOptional()
  photo?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  mustChangePassword!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
