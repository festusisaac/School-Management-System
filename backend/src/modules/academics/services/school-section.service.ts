import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolSection } from '../entities/school-section.entity';

@Injectable()
export class SchoolSectionService {
    constructor(
        @InjectRepository(SchoolSection)
        private readonly schoolSectionRepository: Repository<SchoolSection>,
    ) { }

    async findAll(tenantId: string): Promise<SchoolSection[]> {
        return this.schoolSectionRepository.find({
            where: { tenantId },
            relations: ['classes'],
            order: { createdAt: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<SchoolSection> {
        const section = await this.schoolSectionRepository.findOne({
            where: { id, tenantId },
            relations: ['classes'],
        });
        if (!section) {
            throw new NotFoundException('School section not found');
        }
        return section;
    }

    async create(data: Partial<SchoolSection>, tenantId: string): Promise<SchoolSection> {
        const section = this.schoolSectionRepository.create({
            ...data,
            tenantId,
        });
        return this.schoolSectionRepository.save(section);
    }

    async update(id: string, data: Partial<SchoolSection>, tenantId: string): Promise<SchoolSection> {
        await this.schoolSectionRepository.update({ id, tenantId }, data);
        return this.findOne(id, tenantId);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const section = await this.findOne(id, tenantId);
        if (section.classes && section.classes.length > 0) {
            throw new Error('Cannot delete section with existing classes');
        }
        await this.schoolSectionRepository.remove(section);
    }

    async toggleStatus(id: string, tenantId: string): Promise<SchoolSection> {
        const section = await this.findOne(id, tenantId);
        section.isActive = !section.isActive;
        return this.schoolSectionRepository.save(section);
    }
}
