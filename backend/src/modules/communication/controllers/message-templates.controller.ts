import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MessageTemplatesService } from '../services/message-templates.service';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
} from '../dto/message-template.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';
import { MessageTemplateType } from '../entities/message-template.entity';

@Controller('communication/templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessageTemplatesController {
  constructor(private readonly templatesService: MessageTemplatesService) {}

  @Post()
  @Permissions('communication:manage')
  async create(@Body() createDto: CreateMessageTemplateDto, @Request() req: any) {
    return await this.templatesService.create(createDto, req.user.tenantId);
  }

  @Get()
  @Permissions('communication:view')
  async findAll(@Query('type') type: MessageTemplateType, @Request() req: any) {
    return await this.templatesService.findAll(req.user.tenantId, type);
  }

  @Get(':id')
  @Permissions('communication:view')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return await this.templatesService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @Permissions('communication:manage')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMessageTemplateDto,
    @Request() req: any,
  ) {
    return await this.templatesService.update(id, updateDto, req.user.tenantId);
  }

  @Delete(':id')
  @Permissions('communication:manage')
  async remove(@Param('id') id: string, @Request() req: any) {
    return await this.templatesService.remove(id, req.user.tenantId);
  }
}
