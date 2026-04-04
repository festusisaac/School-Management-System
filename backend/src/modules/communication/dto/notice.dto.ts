import { IsString, IsEnum, IsBoolean, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';
import { NoticeType, NoticeAudience, NoticePriority } from '../entities/notice.entity';

export class CreateNoticeDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsEnum(NoticeType)
  @IsOptional()
  type?: NoticeType = NoticeType.ANNOUNCEMENT;

  @IsEnum(NoticeAudience)
  @IsOptional()
  targetAudience?: NoticeAudience = NoticeAudience.ALL;

  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority = NoticePriority.MEDIUM;

  @IsBoolean()
  @IsOptional()
  isSticky?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsUUID()
  @IsOptional()
  schoolSectionId?: string;
}

export class UpdateNoticeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(NoticeType)
  @IsOptional()
  type?: NoticeType;

  @IsEnum(NoticeAudience)
  @IsOptional()
  targetAudience?: NoticeAudience;

  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority;

  @IsBoolean()
  @IsOptional()
  isSticky?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsUUID()
  @IsOptional()
  schoolSectionId?: string;
}
