import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Introduction to Algorithms' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '9780262033848' })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiPropertyOptional({ example: 'MIT Press' })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiPropertyOptional({ example: '2009-07-31' })
  @IsDateString()
  @IsOptional()
  publishedDate?: Date;

  @ApiPropertyOptional({ example: 'Comprehensive book on algorithms' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['author-uuid-1'] })
  @IsArray()
  @IsOptional()
  authorIds?: string[];

  @ApiPropertyOptional({ example: ['category-uuid-1'] })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];
}
