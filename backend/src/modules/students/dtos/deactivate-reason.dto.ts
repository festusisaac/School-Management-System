import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDeactivateReasonDto {
    @IsString()
    @IsNotEmpty()
    reason!: string;
}

export class UpdateDeactivateReasonDto {
    @IsString()
    @IsNotEmpty()
    reason!: string;
}
