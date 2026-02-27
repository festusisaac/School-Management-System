import { IsNotEmpty, IsOptional, IsNumberString } from 'class-validator';

export class CreateStructureDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @IsOptional()
  applicableToClass?: string;
}
