import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsUUID, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

export class DiscountRuleDto {
    @IsUUID()
    feeHeadId!: string;

    @IsNumberString()
    @IsOptional()
    percentage?: string;

    @IsNumberString()
    @IsOptional()
    fixedAmount?: string;
}

export class CreateDiscountProfileDto {
    @IsString()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DiscountRuleDto)
    @IsOptional()
    rules?: DiscountRuleDto[];

    @IsOptional()
    expiryDate?: string;
}
