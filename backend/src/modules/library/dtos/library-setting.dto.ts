import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLibrarySettingDto {
  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(0)
  @IsOptional()
  graceDays?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @Min(0)
  @IsOptional()
  finePerDay?: number;
}
