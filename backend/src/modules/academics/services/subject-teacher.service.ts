import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SubjectTeacher } from '../entities/subject-teacher.entity';
import { Timetable } from '../entities/timetable.entity';
import { AssignSubjectTeachersDto } from '../dto/assign-subject-teacher.dto';

import { SystemSettingsService } from '../../system/services/system-settings.service';

@Injectable()
export class SubjectTeacherService {
    constructor(
        @InjectRepository(SubjectTeacher)
        private readonly subjectTeacherRepository: Repository<SubjectTeacher>,
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
        private readonly systemSettingsService: SystemSettingsService,
    ) { }

    async assignTeachers(dto: AssignSubjectTeachersDto, tenantId: string) {
        const { classId, sectionId, assignments } = dto;
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const savedAssignments = [];

        for (const assignment of assignments) {
            // Check if assignment exists for this class/section and subject
            let existing = await this.subjectTeacherRepository.findOne({
                where: {
                    classId,
                    sectionId: sectionId || IsNull(),
                    subjectId: assignment.subjectId,
                    tenantId,
                    sessionId: sessionId || undefined as any
                },
            });

            if (existing) {
                // Update teacher
                existing.teacherId = assignment.teacherId;
            } else {
                // Create new
                existing = this.subjectTeacherRepository.create({
                    classId,
                    sectionId: sectionId || null,
                    subjectId: assignment.subjectId,
                    teacherId: assignment.teacherId,
                    tenantId,
                    sessionId: sessionId || undefined
                });
            }

            savedAssignments.push(await this.subjectTeacherRepository.save(existing));

            // Sync with Timetable
            // Update all existing timetable slots for this class/section and subject to match the assigned teacher
            await this.timetableRepository.update(
                {
                    classId,
                    sectionId: sectionId || IsNull(),
                    subjectId: assignment.subjectId,
                    tenantId,
                    sessionId: sessionId || undefined as any
                },
                {
                    teacherId: assignment.teacherId
                }
            );
        }

        return savedAssignments;
    }

    async getTeachersForClassOrSection(tenantId: string, classId: string, sectionId?: string) {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = { tenantId, classId, sectionId: sectionId || IsNull() };
        if (sessionId) where.sessionId = sessionId;

        return this.subjectTeacherRepository.find({
            where,
            relations: ['subject', 'teacher'],
        });
    }

    async getTeachersForSection(sectionId: string, tenantId: string) {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = { sectionId, tenantId };
        if (sessionId) where.sessionId = sessionId;

        return this.subjectTeacherRepository.find({
            where,
            relations: ['subject', 'teacher'],
        });
    }

    async replicateForNewSession(oldSessionId: string, newSessionId: string, tenantId: string): Promise<void> {
        const oldAssignments = await this.subjectTeacherRepository.find({
            where: { sessionId: oldSessionId, tenantId }
        });

        for (const assignment of oldAssignments) {
            const classId = assignment.classId || undefined;
            const sectionId = assignment.sectionId || undefined;
            const existing = await this.subjectTeacherRepository.findOne({
                where: {
                    classId: classId as any,
                    sectionId: (sectionId || IsNull()) as any,
                    subjectId: assignment.subjectId,
                    tenantId,
                    sessionId: newSessionId
                }
            });

            if (!existing) {
                const newAssignment = this.subjectTeacherRepository.create({
                    classId: assignment.classId as string,
                    sectionId: assignment.sectionId as string,
                    subjectId: assignment.subjectId,
                    teacherId: assignment.teacherId,
                    tenantId,
                    sessionId: newSessionId
                });
                await this.subjectTeacherRepository.save(newAssignment);
            }
        }
    }
}
