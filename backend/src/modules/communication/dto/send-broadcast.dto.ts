import { IsEnum, IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export enum BroadcastTarget {
  ALL_STUDENTS = 'ALL_STUDENTS',
  CLASS = 'CLASS',
  SECTION = 'SECTION',
  STAFF = 'STAFF',
  INDIVIDUAL_STUDENTS = 'INDIVIDUAL_STUDENTS',
  INDIVIDUAL_STAFF = 'INDIVIDUAL_STAFF',
}

export class SendBroadcastDto {
  @IsEnum(['EMAIL', 'SMS'])
  channel!: 'EMAIL' | 'SMS';

  @IsEnum(BroadcastTarget)
  target!: BroadcastTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIds?: string[];

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  includeParents?: boolean;
}
