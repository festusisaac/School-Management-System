import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { OnlineClassPlatform, OnlineClassStatus } from '../entities/online-class.entity';

export class CreateOnlineClassDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsNotEmpty()
    startTime!: string;

    @IsDateString()
    @IsNotEmpty()
    endTime!: string;

    @IsEnum(OnlineClassPlatform)
    @IsNotEmpty()
    platform!: OnlineClassPlatform;

    @IsString()
    @IsNotEmpty()
    meetingUrl!: string;

    @IsString()
    @IsOptional()
    meetingId?: string;

    @IsString()
    @IsOptional()
    meetingPassword?: string;

    @IsUUID()
    @IsNotEmpty()
    classId!: string;

    @IsUUID()
    @IsNotEmpty()
    subjectId!: string;

    @IsUUID()
    @IsNotEmpty()
    teacherId!: string;
}
