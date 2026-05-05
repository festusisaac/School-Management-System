import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  DownloadResourceStatus,
  DownloadResourceType,
  DownloadResourceVisibility,
} from '../entities/download-resource.entity';

export class CreateDownloadResourceDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DownloadResourceType)
  resourceType!: DownloadResourceType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsEnum(DownloadResourceVisibility)
  visibility?: DownloadResourceVisibility;

  @IsOptional()
  @IsEnum(DownloadResourceStatus)
  status?: DownloadResourceStatus;

  @IsOptional()
  @IsBooleanString()
  isFeatured?: string;
}

export class UpdateDownloadResourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DownloadResourceType)
  resourceType?: DownloadResourceType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsEnum(DownloadResourceVisibility)
  visibility?: DownloadResourceVisibility;

  @IsOptional()
  @IsEnum(DownloadResourceStatus)
  status?: DownloadResourceStatus;

  @IsOptional()
  @IsBooleanString()
  isFeatured?: string;
}

export class DownloadResourceFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DownloadResourceType)
  resourceType?: DownloadResourceType;

  @IsOptional()
  @IsEnum(DownloadResourceStatus)
  status?: DownloadResourceStatus;

  @IsOptional()
  @IsEnum(DownloadResourceVisibility)
  visibility?: DownloadResourceVisibility;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;
}
