import { PartialType } from '@nestjs/swagger';
import { CreateOnlineClassDto } from './create-online-class.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { OnlineClassStatus } from '../entities/online-class.entity';

export class UpdateOnlineClassDto extends PartialType(CreateOnlineClassDto) {
    @IsEnum(OnlineClassStatus)
    @IsOptional()
    status?: OnlineClassStatus;
}
