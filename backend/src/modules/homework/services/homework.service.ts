import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from '../entities/homework.entity';
import { HomeworkSubmission } from '../entities/submission.entity';
import { CreateHomeworkDto } from '../dto/create-homework.dto';
import { UpdateHomeworkDto } from '../dto/update-homework.dto';
import { EmailService } from '../../communication/email.service';
import { Student } from '../../students/entities/student.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import moment from 'moment';

@Injectable()
export class HomeworkService {
    constructor(
        @InjectRepository(Homework)
        private readonly homeworkRepository: Repository<Homework>,
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        @InjectRepository(HomeworkSubmission)
        private readonly submissionRepository: Repository<HomeworkSubmission>,
        private readonly emailService: EmailService,
        private readonly systemSettingsService: SystemSettingsService,
    ) {}

    async create(createDto: CreateHomeworkDto, tenantId: string): Promise<Homework> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const homework = this.homeworkRepository.create({
            ...createDto,
            tenantId,
            sessionId: sessionId || undefined,
        });
        const savedHomework = await this.homeworkRepository.save(homework);

        // Fetch with relations for notification
        const fullHomework = await this.findOne(savedHomework.id, tenantId);

        // Notify students
        this.notifyStudents(fullHomework, tenantId).catch(err => {
            console.error('Failed to notify students about homework:', err);
        });

        return savedHomework;
    }

    private async notifyStudents(homework: Homework, tenantId: string) {
        try {
            const students = await this.studentRepository.find({
                where: { classId: homework.classId, tenantId, isActive: true },
                select: ['email', 'firstName']
            });

            console.log(`HomeworkService: Found ${students.length} students to notify for class ${homework.classId}`);

            const dueDate = moment(homework.dueDate).format('Do MMM YYYY');
            const subject = `New Homework Assigned: ${homework.title}`;
            const title = `New Assignment for ${homework.subject?.name || 'your class'}`;

            for (const student of students) {
                if (!student.email) {
                    console.log(`HomeworkService: Student ${student.firstName} has no email, skipping.`);
                    continue;
                }

                const message = `
                    Hello ${student.firstName || 'Student'},<br/><br/>
                    A new homework assignment has been posted for your class.<br/><br/>
                    <strong>Title:</strong> ${homework.title}<br/>
                    <strong>Subject:</strong> ${homework.subject?.name || 'N/A'}<br/>
                    <strong>Due Date:</strong> ${dueDate}<br/><br/>
                    Please log in to the portal to view the details and download any attachments.<br/><br/>
                    <em>Remember to submit your work before the deadline.</em>
                `;

                console.log(`HomeworkService: Attempting to send email to ${student.email}`);
                const sent = await this.emailService.sendNotificationEmail(student.email, subject, message, title);
                console.log(`HomeworkService: Email to ${student.email} ${sent ? 'SUCCESS' : 'FAILED'}`);
            }
        } catch (error) {
            console.error('Error in notifyStudents (Homework):', error);
        }
    }

    async findAll(tenantId: string, filters: { classId?: string; classIds?: string[]; subjectId?: string; teacherId?: string }, studentId?: string): Promise<Homework[]> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const query = this.homeworkRepository.createQueryBuilder('hw')
            .leftJoinAndSelect('hw.class', 'class')
            .leftJoinAndSelect('hw.subject', 'subject')
            .leftJoinAndSelect('hw.teacher', 'teacher')
            .where('hw.tenantId = :tenantId', { tenantId });

        // Scope to active session
        if (sessionId) {
            query.andWhere('hw.sessionId = :sessionId', { sessionId });
        }

        if (filters.classIds && Array.isArray(filters.classIds)) {
            query.andWhere('hw.classId IN (:...classIds)', { classIds: filters.classIds });
        } else if (filters.classId) {
            query.andWhere('hw.classId = :classId', { classId: filters.classId });
        }
        if (filters.subjectId) {
            query.andWhere('hw.subjectId = :subjectId', { subjectId: filters.subjectId });
        }
        if (filters.teacherId) {
            query.andWhere('hw.teacherId = :teacherId', { teacherId: filters.teacherId });
        }

        const homeworks = await query.orderBy('hw.createdAt', 'DESC').getMany();

        if (studentId) {
            const submissions = await this.submissionRepository.find({
                where: { studentId, tenantId }
            });

            return homeworks.map(h => ({
                ...h,
                submission: submissions.find(s => s.homeworkId === h.id)
            })) as any;
        }

        return homeworks;
    }

    async findOne(id: string, tenantId: string): Promise<Homework> {
        const homework = await this.homeworkRepository.findOne({
            where: { id, tenantId },
            relations: ['class', 'subject', 'teacher'],
        });

        if (!homework) {
            throw new NotFoundException(`Homework with ID ${id} not found`);
        }

        return homework;
    }

    async update(id: string, updateDto: UpdateHomeworkDto, tenantId: string): Promise<Homework> {
        const homework = await this.findOne(id, tenantId);
        Object.assign(homework, updateDto);
        return await this.homeworkRepository.save(homework);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const homework = await this.findOne(id, tenantId);
        await this.homeworkRepository.remove(homework);
    }
}
