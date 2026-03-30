import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { MessageTemplateType } from '../entities/message-template.entity';

export class CreateMessageTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MessageTemplateType)
  @IsNotEmpty()
  type!: MessageTemplateType;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class UpdateMessageTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(MessageTemplateType)
  @IsOptional()
  type?: MessageTemplateType;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
