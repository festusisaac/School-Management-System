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
            const where = {
                classId,
                sectionId: sectionId || IsNull(),
                subjectId: assignment.subjectId,
                tenantId,
                sessionId: sessionId || undefined as any
            };

            if (!assignment.teacherId) {
                // UNASSIGN: Delete the assignment record
                await this.subjectTeacherRepository.delete(where);
                
                // Sync with Timetable: Remove teacher from classes for this subject
                await this.timetableRepository.update(where, { teacherId: null });
                continue;
            }

            // ASSIGN or UPDATE:
            let existing = await this.subjectTeacherRepository.findOne({ where });

            if (existing) {
                existing.teacherId = assignment.teacherId;
            } else {
                existing = this.subjectTeacherRepository.create({
                    ...where,
                    sectionId: sectionId || null,
                    teacherId: assignment.teacherId,
                });
            }

            savedAssignments.push(await this.subjectTeacherRepository.save(existing));

            // Sync with Timetable: Update teacher for this subject
            await this.timetableRepository.update(where, { teacherId: assignment.teacherId });
        }

        return savedAssignments;
    }

    async getTeachersForClassOrSection(tenantId: string, classId: string, sectionId?: string, sessionId?: string) {
        const activeSessionId = sessionId || await this.systemSettingsService.getActiveSessionId();
        const where: any = { tenantId, classId, sectionId: sectionId || IsNull() };
        if (activeSessionId) where.sessionId = activeSessionId;

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
