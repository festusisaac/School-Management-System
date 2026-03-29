import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AcademicTerm } from '../entities/academic-term.entity';
import { CreateAcademicTermDto } from '../dtos/create-academic-term.dto';
import { UpdateAcademicTermDto } from '../dtos/update-academic-term.dto';
import { SystemSettingsService } from './system-settings.service';

@Injectable()
export class AcademicTermsService {
    constructor(
        @InjectRepository(AcademicTerm)
        private readonly termRepository: Repository<AcademicTerm>,
        private readonly systemSettingsService: SystemSettingsService,
    ) { }

    async findAll(): Promise<AcademicTerm[]> {
        return this.termRepository.find({
            relations: ['session'],
            order: { createdAt: 'DESC' },
        });
    }

    async findAllBySession(sessionId: string): Promise<AcademicTerm[]> {
        return this.termRepository.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
    }

    async findOne(id: string): Promise<AcademicTerm> {
        const term = await this.termRepository.findOne({
            where: { id },
            relations: ['session'],
        });
        if (!term) {
            throw new NotFoundException(`AcademicTerm with ID ${id} not found`);
        }
        return term;
    }

    async create(createDto: CreateAcademicTermDto): Promise<AcademicTerm> {
        const term = this.termRepository.create(createDto);
        const saved = await this.termRepository.save(term);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    async update(id: string, updateDto: UpdateAcademicTermDto): Promise<AcademicTerm> {
        const term = await this.findOne(id);
        this.termRepository.merge(term, updateDto);
        const saved = await this.termRepository.save(term);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    private async enforceSingularActive(activeId: string): Promise<void> {
        // 1. Deactivate all other terms (globally, assuming only one active term)
        await this.termRepository.update({ id: Not(activeId) }, { isActive: false });

        // 2. Synchronize the global settings to point to this new term ID
        await this.systemSettingsService.updateSettings({ currentTermId: activeId });
    }

    async remove(id: string): Promise<void> {
        const term = await this.findOne(id);
        await this.termRepository.remove(term);
    }
}
