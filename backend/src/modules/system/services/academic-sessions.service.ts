import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { AcademicSession } from '../entities/academic-session.entity';
import { CreateAcademicSessionDto } from '../dtos/create-academic-session.dto';
import { UpdateAcademicSessionDto } from '../dtos/update-academic-session.dto';
import { SystemSettingsService } from './system-settings.service';

@Injectable()
export class AcademicSessionsService {
    constructor(
        @InjectRepository(AcademicSession)
        private readonly sessionRepository: Repository<AcademicSession>,
        private readonly moduleRef: ModuleRef,
        private readonly systemSettingsService: SystemSettingsService,
    ) { }

    async findAll(): Promise<AcademicSession[]> {
        return this.sessionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<AcademicSession> {
        const session = await this.sessionRepository.findOne({ where: { id } });
        if (!session) {
            throw new NotFoundException(`AcademicSession with ID ${id} not found`);
        }
        return session;
    }

    async create(createDto: CreateAcademicSessionDto): Promise<AcademicSession> {
        const session = this.sessionRepository.create(createDto);
        const saved = await this.sessionRepository.save(session);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    async update(id: string, updateDto: UpdateAcademicSessionDto): Promise<AcademicSession> {
        const session = await this.findOne(id);
        this.sessionRepository.merge(session, updateDto);
        const saved = await this.sessionRepository.save(session);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    private async enforceSingularActive(activeId: string): Promise<void> {
        // 1. Deactivate all other sessions
        await this.sessionRepository.update({ id: Not(activeId) }, { isActive: false });

        // 2. Synchronize the global settings to point to this new session ID
        await this.systemSettingsService.updateSettings({ currentSessionId: activeId });
    }

    async remove(id: string): Promise<void> {
        const session = await this.findOne(id);
        await this.sessionRepository.remove(session);
    }

    // Unified Transition Logic (All-at-once)
    async startTransition(toId: string, fromId: string, tenantId: string) {
        const toSession = await this.findOne(toId);
        const fromSession = await this.findOne(fromId);

        // 1. Replicate Timetable
        try {
            // Dynamic resolution to avoid circular dependencies
            const { TimetableService } = await import('../../academics/services/timetable.service');
            const timetableService = this.moduleRef.get(TimetableService, { strict: false });
            if (timetableService) {
                await (timetableService as any).replicateTimetableForNewSession(fromId, toId, tenantId);
            }
        } catch (e) {
            console.error('Timetable replication failed during transition:', e);
        }

        // 2. Fee Carry Forward
        try {
            const { FeesService } = await import('../../finance/services/fees.service');
            const feesService = this.moduleRef.get(FeesService, { strict: false });
            if (feesService) {
                await (feesService as any).carryForwardAllBalances(fromId, toId, tenantId);
            }
        } catch (e) {
            console.error('Fee carry-forward failed during transition:', e);
        }

        return { 
            message: `Transitioning from ${fromSession.name} to ${toSession.name} successful. Timetables and fee balances have been processed.`,
            status: 'success' 
        };
    }
}

