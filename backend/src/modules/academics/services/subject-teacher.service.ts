import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SubjectTeacher } from '../entities/subject-teacher.entity';
import { Timetable } from '../entities/timetable.entity';
import { AssignSubjectTeachersDto } from '../dto/assign-subject-teacher.dto';

@Injectable()
export class SubjectTeacherService {
    constructor(
        @InjectRepository(SubjectTeacher)
        private readonly subjectTeacherRepository: Repository<SubjectTeacher>,
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
    ) { }

    async assignTeachers(dto: AssignSubjectTeachersDto, tenantId: string) {
        const { classId, sectionId, assignments } = dto;
        const savedAssignments = [];

        for (const assignment of assignments) {
            // Check if assignment exists for this class/section and subject
            let existing = await this.subjectTeacherRepository.findOne({
                where: {
                    classId,
                    sectionId: sectionId || IsNull(),
                    subjectId: assignment.subjectId,
                    tenantId,
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
                    tenantId
                },
                {
                    teacherId: assignment.teacherId
                }
            );
        }

        return savedAssignments;
    }

    async getTeachersForClassOrSection(tenantId: string, classId: string, sectionId?: string) {
        return this.subjectTeacherRepository.find({
            where: {
                tenantId,
                classId,
                sectionId: sectionId || IsNull()
            },
            relations: ['subject', 'teacher', 'teacher.designation'],
        });
    }

    async getTeachersForSection(sectionId: string, tenantId: string) {
        return this.subjectTeacherRepository.find({
            where: { sectionId, tenantId },
            relations: ['subject', 'teacher', 'teacher.designation'],
        });
    }
}
