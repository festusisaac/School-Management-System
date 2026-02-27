import { IsNotEmpty, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReminderChannel } from '../entities/payment-reminder.entity';

export class BulkReminderDto {
    @IsArray()
    @IsNotEmpty()
    studentIds!: string[];

    @IsEnum(ReminderChannel)
    @IsNotEmpty()
    channel!: ReminderChannel;

    @IsOptional()
    @IsString()
    messageTemplate?: string;
}
