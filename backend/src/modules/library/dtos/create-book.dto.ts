import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'Introduction to Algorithms' })
  @IsString()
  title!: string;

  @ApiProperty({ example: '9780262033848', required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: 'MIT Press', required: false })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ example: '2009-07-31', required: false })
  @IsDateString()
  @IsOptional()
  publishedDate?: Date;

  @ApiProperty({ example: 'Comprehensive book on algorithms', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['author-uuid-1'], required: false })
  @IsArray()
  @IsOptional()
  authorIds?: string[];

  @ApiProperty({ example: ['category-uuid-1'], required: false })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  initialCopies?: number;

  @ApiProperty({ example: 'ACC-001', required: false })
  @IsOptional()
  startingBarcode?: string;

  @ApiProperty({ example: '1st Edition', required: false })
  @IsOptional()
  edition?: string;

  @ApiProperty({ example: 'English', required: false })
  @IsOptional()
  language?: string;
}
