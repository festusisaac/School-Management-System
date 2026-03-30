import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate, MessageTemplateType } from '../entities/message-template.entity';
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from '../dto/message-template.dto';

@Injectable()
export class MessageTemplatesService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepository: Repository<MessageTemplate>,
  ) {}

  async create(createDto: CreateMessageTemplateDto, tenantId: string): Promise<MessageTemplate> {
    const template = this.templateRepository.create({
      ...createDto,
      tenantId,
    });
    return await this.templateRepository.save(template);
  }

  async findAll(tenantId: string, type?: MessageTemplateType): Promise<MessageTemplate[]> {
    const query: any = { tenantId };
    if (type) {
      query.type = type;
    }
    return await this.templateRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenantId },
    });
    if (!template) {
      throw new NotFoundException(`Message template with ID ${id} not found`);
    }
    return template;
  }

  async update(id: string, updateDto: UpdateMessageTemplateDto, tenantId: string): Promise<MessageTemplate> {
    const template = await this.findOne(id, tenantId);
    Object.assign(template, updateDto);
    return await this.templateRepository.save(template);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const template = await this.findOne(id, tenantId);
    await this.templateRepository.remove(template);
  }
}
