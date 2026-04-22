import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
