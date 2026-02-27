import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateOnlineAdmissionStatusDto {
    @IsEnum(['pending', 'approved', 'rejected'])
    @IsNotEmpty()
    status!: 'pending' | 'approved' | 'rejected';
}
