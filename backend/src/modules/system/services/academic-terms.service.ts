import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AcademicTerm } from '../entities/academic-term.entity';
import { AcademicSession } from '../entities/academic-session.entity';
import { CreateAcademicTermDto } from '../dtos/create-academic-term.dto';
import { UpdateAcademicTermDto } from '../dtos/update-academic-term.dto';
import { SystemSettingsService } from './system-settings.service';

@Injectable()
export class AcademicTermsService {
    constructor(
        @InjectRepository(AcademicTerm)
        private readonly termRepository: Repository<AcademicTerm>,
        @InjectRepository(AcademicSession)
        private readonly sessionRepository: Repository<AcademicSession>,
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
        if (!createDto.startDate || !createDto.endDate) {
            throw new BadRequestException('Term Start Date and End Date are required');
        }

        await this.validateTermDates(createDto.sessionId, createDto.startDate, createDto.endDate);
        await this.validateNoOverlap(createDto.sessionId, createDto.startDate, createDto.endDate);

        const term = this.termRepository.create(createDto);
        const saved = await this.termRepository.save(term);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    async update(id: string, updateDto: UpdateAcademicTermDto): Promise<AcademicTerm> {
        const term = await this.findOne(id);

        if (updateDto.startDate || updateDto.endDate || updateDto.sessionId) {
            const start = updateDto.startDate || term.startDate;
            const end = updateDto.endDate || term.endDate;
            const sessionId = updateDto.sessionId || term.sessionId;

            await this.validateTermDates(sessionId, start, end);
            await this.validateNoOverlap(sessionId, start, end, id);
        }

        this.termRepository.merge(term, updateDto);
        const saved = await this.termRepository.save(term);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    private async validateTermDates(sessionId: string, start: Date | string, end: Date | string): Promise<void> {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
        if (!session) {
            throw new NotFoundException(`Academic Session with ID ${sessionId} not found`);
        }

        const termStart = new Date(start);
        const termEnd = new Date(end);
        const sessionStart = new Date(session.startDate);
        const sessionEnd = new Date(session.endDate);

        if (termStart < sessionStart || termEnd > sessionEnd) {
            throw new BadRequestException(
                `Date Range Error: The term dates (${termStart.toLocaleDateString()} - ${termEnd.toLocaleDateString()}) must fall within the parent session's range (${sessionStart.toLocaleDateString()} - ${sessionEnd.toLocaleDateString()}).`
            );
        }

        if (termStart >= termEnd) {
            throw new BadRequestException('Term start date must be before the end date.');
        }
    }

    private async validateNoOverlap(sessionId: string, start: Date | string, end: Date | string, excludeId?: string): Promise<void> {
        const query = this.termRepository.createQueryBuilder('t')
            .where('t.sessionId = :sessionId', { sessionId })
            .andWhere('t.startDate < :end', { end })
            .andWhere('t.endDate > :start', { start });

        if (excludeId) {
            query.andWhere('t.id != :excludeId', { excludeId });
        }

        const overlap = await query.getOne();
        if (overlap) {
            throw new BadRequestException(
                `Overlap Detected: This term conflicts with the '${overlap.name}' term in the same session.`
            );
        }
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
