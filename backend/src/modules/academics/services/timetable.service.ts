import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TimetablePeriod, PeriodType } from '../entities/timetable-period.entity';
import { Timetable } from '../entities/timetable.entity';
import { SubjectTeacher } from '../entities/subject-teacher.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TimetableService {
    constructor(
        @InjectRepository(TimetablePeriod)
        private periodRepository: Repository<TimetablePeriod>,
        @InjectRepository(Timetable)
        private timetableRepository: Repository<Timetable>,
        @InjectRepository(SubjectTeacher)
        private subjectTeacherRepository: Repository<SubjectTeacher>,
    ) { }

    // --- Timetable Periods ---
    async createPeriod(data: Partial<TimetablePeriod>): Promise<TimetablePeriod> {
        // Validate time overlap for the same tenant
        const existingPeriods = await this.periodRepository.find({
            where: { tenantId: data.tenantId }
        });

        // Check for time overlap
        for (const period of existingPeriods) {
            if (this.timesOverlap(data.startTime!, data.endTime!, period.startTime, period.endTime)) {
                throw new ConflictException(`Time slot overlaps with existing period "${period.name}"`);
            }
        }

        const newPeriod = this.periodRepository.create(data);
        return this.periodRepository.save(newPeriod);
    }

    private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
        const s1 = toMinutes(start1), e1 = toMinutes(end1);
        const s2 = toMinutes(start2), e2 = toMinutes(end2);
        return s1 < e2 && e1 > s2;
    }

    async getAllPeriods(tenantId: string | null): Promise<TimetablePeriod[]> {
        return this.periodRepository.find({
            where: { tenantId: tenantId || IsNull() },
            order: { periodOrder: 'ASC' },
        });
    }

    async getPeriodById(id: string): Promise<TimetablePeriod> {
        const period = await this.periodRepository.findOne({ where: { id } });
        if (!period) throw new NotFoundException('Period not found');
        return period;
    }

    async updatePeriod(id: string, data: Partial<TimetablePeriod>): Promise<TimetablePeriod> {
        const period = await this.getPeriodById(id);
        Object.assign(period, data);
        return this.periodRepository.save(period);
    }

    async deletePeriod(id: string): Promise<void> {
        const period = await this.getPeriodById(id);

        // Check if period is used in any timetable
        const usedInTimetable = await this.timetableRepository.findOne({
            where: { periodId: id }
        });

        if (usedInTimetable) {
            throw new BadRequestException('Cannot delete period that is used in timetables. Remove all timetable entries using this period first.');
        }

        await this.periodRepository.remove(period);
    }

    async reorderPeriods(tenantId: string, periodIds: string[]): Promise<TimetablePeriod[]> {
        const periods = await this.periodRepository.find({ where: { tenantId } });

        for (let i = 0; i < periodIds.length; i++) {
            const period = periods.find(p => p.id === periodIds[i]);
            if (period) {
                period.periodOrder = i + 1;
                await this.periodRepository.save(period);
            }
        }

        return this.getAllPeriods(tenantId);
    }

    // Initialize default school periods matching the image
    async initializeDefaultPeriods(tenantId: string): Promise<TimetablePeriod[]> {
        const existingPeriods = await this.periodRepository.find({ where: { tenantId } });
        if (existingPeriods.length > 0) {
            return existingPeriods;
        }

        const defaultPeriods = [
            { name: 'Assembly/Class Meeting/PPI', type: PeriodType.ASSEMBLY, startTime: '07:00', endTime: '08:20', periodOrder: 1 },
            { name: 'Period 1', type: PeriodType.LESSON, startTime: '08:20', endTime: '09:00', periodOrder: 2 },
            { name: 'Period 2', type: PeriodType.LESSON, startTime: '09:00', endTime: '09:40', periodOrder: 3 },
            { name: 'Break', type: PeriodType.BREAK, startTime: '09:40', endTime: '10:00', periodOrder: 4 },
            { name: 'Period 3', type: PeriodType.LESSON, startTime: '10:00', endTime: '10:40', periodOrder: 5 },
            { name: 'Period 4', type: PeriodType.LESSON, startTime: '10:40', endTime: '11:20', periodOrder: 6 },
            { name: 'Break', type: PeriodType.BREAK, startTime: '11:20', endTime: '11:35', periodOrder: 7 },
            { name: 'Period 5', type: PeriodType.LESSON, startTime: '11:35', endTime: '12:05', periodOrder: 8 },
            { name: 'Period 6', type: PeriodType.LESSON, startTime: '12:05', endTime: '12:55', periodOrder: 9 },
            { name: 'Lunch', type: PeriodType.LUNCH, startTime: '12:55', endTime: '14:00', periodOrder: 10 },
            { name: 'Period 7', type: PeriodType.LESSON, startTime: '14:00', endTime: '14:40', periodOrder: 11 },
            { name: 'Period 8', type: PeriodType.LESSON, startTime: '14:40', endTime: '15:20', periodOrder: 12 },
            { name: 'Period 9', type: PeriodType.LESSON, startTime: '15:20', endTime: '16:00', periodOrder: 13 },
            { name: 'Games/Clubs & Societies/Career Guidance', type: PeriodType.GAMES, startTime: '16:00', endTime: '17:00', periodOrder: 14 },
        ];

        const createdPeriods: TimetablePeriod[] = [];
        for (const periodData of defaultPeriods) {
            const period = this.periodRepository.create({ ...periodData, tenantId });
            createdPeriods.push(await this.periodRepository.save(period));
        }

        return createdPeriods;
    }

    // --- Timetable Slots ---
    async createTimetableSlot(data: Partial<Timetable>): Promise<Timetable> {
        // Check for existing slot at the same day/period/class/section
        const existingSlot = await this.timetableRepository.findOne({
            where: {
                classId: data.classId,
                sectionId: data.sectionId ? data.sectionId : IsNull(),
                dayOfWeek: data.dayOfWeek,
                periodId: data.periodId,
            }
        });

        if (existingSlot) {
            throw new ConflictException('A slot already exists for this class/section at this day and period');
        }

        // Auto-assign teacher if not provided
        if (!data.teacherId && data.subjectId && data.classId) {
            const assignment = await this.subjectTeacherRepository.findOne({
                where: {
                    classId: data.classId,
                    sectionId: data.sectionId ? data.sectionId : IsNull(),
                    subjectId: data.subjectId,
                    tenantId: data.tenantId
                }
            });
            if (assignment) {
                data.teacherId = assignment.teacherId;
            }
        }

        // Validate Teacher Availability
        if (data.teacherId && data.dayOfWeek && data.periodId) {
            await this.checkTeacherAvailability(
                data.teacherId,
                data.dayOfWeek,
                data.periodId,
                data.tenantId,
            );
        }

        const newSlot = this.timetableRepository.create(data);
        return this.timetableRepository.save(newSlot);
    }

    async getTimetable(classId: string, sectionId: string | null, tenantId: string): Promise<Timetable[]> {
        return this.timetableRepository.find({
            where: {
                classId,
                sectionId: sectionId ? sectionId : IsNull(),
                tenantId
            },
            relations: ['subject', 'period', 'teacher'],
            order: { dayOfWeek: 'ASC', period: { periodOrder: 'ASC' } },
        });
    }

    async getTeacherTimetable(teacherId: string, tenantId: string): Promise<Timetable[]> {
        return this.timetableRepository.find({
            where: { teacherId, tenantId },
            relations: ['subject', 'period', 'class', 'section'],
            order: { dayOfWeek: 'ASC', period: { periodOrder: 'ASC' } },
        });
    }

    async getTeacherTodayTimetable(teacherId: string, tenantId: string): Promise<any[]> {
        // JavaScript getDay(): 0=Sunday, 1=Monday, ...
        const today = new Date().getDay();
        const slots = await this.timetableRepository.find({
            where: { teacherId, tenantId, dayOfWeek: today },
            relations: ['subject', 'period', 'class', 'section'],
            order: { period: { periodOrder: 'ASC' } },
        });

        return slots.map(slot => ({
            id: slot.id,
            startTime: slot.period?.startTime || '',
            endTime: slot.period?.endTime || '',
            subjectName: slot.subject?.name || 'N/A',
            className: `${slot.class?.name || ''}${slot.section ? ' - ' + slot.section.name : ''}`.trim(),
        }));
    }

    async getTimetableSlotById(id: string): Promise<Timetable> {
        const slot = await this.timetableRepository.findOne({
            where: { id },
            relations: ['subject', 'period', 'class', 'section', 'teacher'],
        });
        if (!slot) throw new NotFoundException('Timetable slot not found');
        return slot;
    }

    async updateTimetableSlot(id: string, data: Partial<Timetable>): Promise<Timetable> {
        const slot = await this.getTimetableSlotById(id);

        // Try to resolve teacher if not explicitly provided
        if (!data.teacherId) {
            const currentSubjectId = data.subjectId || slot.subjectId;
            const assignment = await this.subjectTeacherRepository.findOne({
                where: {
                    classId: slot.classId,
                    sectionId: slot.sectionId ? slot.sectionId : IsNull(),
                    subjectId: currentSubjectId,
                    tenantId: slot.tenantId
                }
            });

            if (assignment) {
                data.teacherId = assignment.teacherId;
            } else if (data.subjectId && data.subjectId !== slot.subjectId) {
                // Clear teacher if subject changed and no teacher found for new subject
                (data as any).teacherId = null;
            }
        }

        // Validate Class/Section availability if day or period changes
        const newDay = data.dayOfWeek === undefined ? slot.dayOfWeek : data.dayOfWeek;
        const newPeriodId = data.periodId === undefined ? slot.periodId : data.periodId;

        if (data.dayOfWeek !== undefined || data.periodId !== undefined) {
            const classConflict = await this.timetableRepository.findOne({
                where: {
                    classId: slot.classId,
                    sectionId: slot.sectionId ? slot.sectionId : IsNull(),
                    dayOfWeek: newDay,
                    periodId: newPeriodId,
                    tenantId: slot.tenantId
                }
            });

            if (classConflict && classConflict.id !== id) {
                throw new ConflictException('A slot already exists for this class/section at this day and period');
            }
        }

        // Validate Teacher Availability if teacher, day, or period changes
        const newTeacherId = data.teacherId === undefined ? slot.teacherId : data.teacherId;

        if (newTeacherId && (data.teacherId !== undefined || data.dayOfWeek !== undefined || data.periodId !== undefined || (data as any).subjectId !== undefined)) {
            await this.checkTeacherAvailability(
                newTeacherId,
                newDay,
                newPeriodId,
                slot.tenantId || undefined,
                id // Exclude current slot
            );
        }

        Object.assign(slot, data);
        return this.timetableRepository.save(slot);
    }

    async deleteTimetableSlot(id: string): Promise<void> {
        const slot = await this.timetableRepository.findOne({ where: { id } });
        if (!slot) throw new NotFoundException('Timetable slot not found');
        await this.timetableRepository.remove(slot);
    }

    async clearTimetable(classId: string, sectionId: string | null, tenantId: string): Promise<void> {
        await this.timetableRepository.delete({ classId, sectionId: sectionId ? sectionId : IsNull(), tenantId });
    }

    // Bulk create/update timetable slots
    async saveTimetableBulk(
        classId: string,
        sectionId: string,
        tenantId: string,
        slots: Array<{ dayOfWeek: number; periodId: string; subjectId: string; teacherId?: string; roomNumber?: string }>
    ): Promise<Timetable[]> {
        // Clear existing timetable for this class/section
        await this.clearTimetable(classId, sectionId, tenantId);

        // Pre-fetch subject teachers for this class/section
        const subjectTeachers = await this.subjectTeacherRepository.find({
            where: { classId, sectionId: sectionId ? sectionId : IsNull(), tenantId }
        });
        const teacherMap = new Map(subjectTeachers.map(st => [st.subjectId, st.teacherId]));

        // Create new slots
        const newSlots: Timetable[] = [];
        for (const slot of slots) {
            let teacherId = slot.teacherId;

            // If no specific teacher assigned in slot, try to find from subject-teacher map
            if (!teacherId) {
                teacherId = teacherMap.get(slot.subjectId) || undefined;
            }

            // Validate conflict
            if (teacherId) {
                await this.checkTeacherAvailability(
                    teacherId,
                    slot.dayOfWeek,
                    slot.periodId,
                    tenantId,
                );
            }

            const newSlot = this.timetableRepository.create({
                ...slot,
                classId,
                sectionId,
                teacherId, // Use resolved teacherId
                tenantId,
            });
            newSlots.push(await this.timetableRepository.save(newSlot));
        }

        return this.getTimetable(classId, sectionId, tenantId);
    }

    // Copy timetable from one class/section to another
    async copyTimetable(
        sourceClassId: string,
        sourceSectionId: string | null,
        targetClassId: string,
        targetSectionId: string | null,
        tenantId: string
    ): Promise<Timetable[]> {
        const sourceSlots = await this.getTimetable(sourceClassId, sourceSectionId, tenantId);

        // Clear target timetable
        await this.clearTimetable(targetClassId, targetSectionId, tenantId);

        // Copy slots
        for (const sourceSlot of sourceSlots) {
            const newSlot = this.timetableRepository.create({
                classId: targetClassId,
                sectionId: targetSectionId,
                tenantId,
                dayOfWeek: sourceSlot.dayOfWeek,
                periodId: sourceSlot.periodId,
                subjectId: sourceSlot.subjectId,
                teacherId: null, // Don't copy teacher assignment to avoid conflicts
                roomNumber: sourceSlot.roomNumber,
            });
            await this.timetableRepository.save(newSlot);
        }

        return this.getTimetable(targetClassId, targetSectionId, tenantId);
    }

    // --- Helper Methods ---

    /**
     * Checks if a teacher is already assigned to a different class/section at the same time.
     * Throws ConflictException if a conflict is found.
     */
    /**
     * Helper for file logging since we can't see the terminal easily.
     */
    private logDebug(message: string) {
        const logPath = path.join(process.cwd(), 'debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    }

    private async checkTeacherAvailability(
        teacherId: string,
        dayOfWeek: number,
        periodId: string,
        tenantId: string | undefined,
        excludeSlotId?: string
    ): Promise<void> {
        if (!teacherId) return;

        this.logDebug(`Conflict check: Teacher=${teacherId}, Day=${dayOfWeek}, Period=${periodId}, Tenant=${tenantId}, Exclude=${excludeSlotId}`);

        try {
            // Build query to find any existing slot for this teacher at this time.
            const query = this.timetableRepository.createQueryBuilder('timetable')
                .leftJoinAndSelect('timetable.class', 'class')
                .leftJoinAndSelect('timetable.section', 'section')
                .leftJoin(SubjectTeacher, 'st', 'st.subjectId = timetable.subjectId AND st.classId = timetable.classId AND (st.sectionId = timetable.sectionId OR (st.sectionId IS NULL AND timetable.sectionId IS NULL)) AND st.tenantId = timetable.tenantId')
                .where('timetable.dayOfWeek = :dayOfWeek', { dayOfWeek })
                .andWhere('timetable.periodId = :periodId', { periodId })
                .andWhere(
                    '(timetable.teacherId = :teacherId OR (timetable.teacherId IS NULL AND st.teacherId = :teacherId))',
                    { teacherId: teacherId.trim() }
                );

            if (tenantId) {
                query.andWhere('timetable.tenantId = :tenantId', { tenantId });
            }

            if (excludeSlotId) {
                query.andWhere('timetable.id != :excludeSlotId', { excludeSlotId });
            }

            const conflictingSlot = await query.getOne();

            if (conflictingSlot) {
                this.logDebug(`CONFLICT FOUND! SlotID: ${conflictingSlot.id}, Class: ${conflictingSlot.class?.name}`);
                const className = conflictingSlot.class?.name || 'Unknown Class';
                const sectionName = conflictingSlot.section?.name || 'Unknown Section';
                throw new ConflictException(
                    `Teacher is already assigned to ${className} - ${sectionName} at this time.`
                );
            } else {
                this.logDebug(`No conflict found.`);
            }
        } catch (error: any) {
            if (!(error instanceof ConflictException)) {
                this.logDebug(`ERROR IN CONFLICT CHECK: ${error.message}\n${error.stack}`);
            }
            throw error;
        }
    }
}
