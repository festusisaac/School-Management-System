import { IsNotEmpty, IsEnum, IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateOnlineAdmissionStatusDto {
    @IsEnum(['pending', 'approved', 'rejected'])
    @IsNotEmpty()
    status!: 'pending' | 'approved' | 'rejected';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    feeGroupIds?: string[];
}
