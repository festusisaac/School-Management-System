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
        if (!createDto.startDate || !createDto.endDate) {
            throw new BadRequestException('Session Start Date and End Date are required');
        }
        await this.validateNoOverlap(createDto.startDate!, createDto.endDate!);
        
        // Auto-activate if it's the first session
        const sessionCount = await this.sessionRepository.count();
        if (sessionCount === 0) {
            createDto.isActive = true;
        }

        const session = this.sessionRepository.create(createDto);
        const saved = await this.sessionRepository.save(session);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    async update(id: string, updateDto: UpdateAcademicSessionDto): Promise<AcademicSession> {
        const session = await this.findOne(id);

        if (updateDto.startDate || updateDto.endDate) {
            const start = updateDto.startDate || session.startDate;
            const end = updateDto.endDate || session.endDate;
            await this.validateNoOverlap(start, end, id);
        }

        // Guard: Prevent deactivating the only active session
        if (updateDto.isActive === false && session.isActive === true) {
            const otherActive = await this.sessionRepository.findOne({
                where: { isActive: true, id: Not(id) }
            });
            if (!otherActive) {
                throw new BadRequestException('Cannot deactivate the only active session. Please activate another session to replace it.');
            }
        }

        this.sessionRepository.merge(session, updateDto);
        const saved = await this.sessionRepository.save(session);
        if (saved.isActive) {
            await this.enforceSingularActive(saved.id);
        }
        return saved;
    }

    private async validateNoOverlap(start: Date | string, end: Date | string, excludeId?: string): Promise<void> {
        const query = this.sessionRepository.createQueryBuilder('s')
            .where('s.startDate < :end', { end })
            .andWhere('s.endDate > :start', { start });

        if (excludeId) {
            query.andWhere('s.id != :excludeId', { excludeId });
        }

        const overlap = await query.getOne();
        if (overlap) {
            const startStr = new Date(start).toLocaleDateString();
            const endStr = new Date(end).toLocaleDateString();
            const overlapStart = new Date(overlap.startDate).toLocaleDateString();
            const overlapEnd = new Date(overlap.endDate).toLocaleDateString();
            
            throw new BadRequestException(
                `Scheduling Conflict: The dates you selected (${startStr} - ${endStr}) overlap with the '${overlap.name}' session, which is already scheduled from ${overlapStart} to ${overlapEnd}. Please adjust the dates to ensure they do not intersect with existing sessions.`
            );
        }
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
            const { TimetableService } = await import('../../academics/services/timetable.service');
            const service = this.moduleRef.get(TimetableService, { strict: false });
            if (service) await (service as any).replicateTimetableForNewSession(fromId, toId, tenantId);
        } catch (e) { console.error('Timetable replication failed:', e); }

        // 2. Replicate Subject Assignments
        try {
            const { ClassSubjectService } = await import('../../academics/services/class-subject.service');
            const service = this.moduleRef.get(ClassSubjectService, { strict: false });
            if (service) await (service as any).replicateForNewSession(fromId, toId, tenantId);
        } catch (e) { console.error('ClassSubject replication failed:', e); }

        // 3. Replicate Teacher Assignments
        try {
            const { SubjectTeacherService } = await import('../../academics/services/subject-teacher.service');
            const service = this.moduleRef.get(SubjectTeacherService, { strict: false });
            if (service) await (service as any).replicateForNewSession(fromId, toId, tenantId);
        } catch (e) { console.error('SubjectTeacher replication failed:', e); }

        // 4. Replicate Grade Scales
        try {
            const { ExamSetupService } = await import('../../examination/services/exam-setup.service');
            const service = this.moduleRef.get(ExamSetupService, { strict: false });
            if (service) await (service as any).replicateGradeScalesForNewSession(fromId, toId, tenantId);
        } catch (e) { console.error('GradeScale replication failed:', e); }

        // 5. Fee Carry Forward
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

