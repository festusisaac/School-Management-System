import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from '../entities/homework.entity';
import { HomeworkSubmission } from '../entities/submission.entity';
import { CreateHomeworkDto } from '../dto/create-homework.dto';
import { UpdateHomeworkDto } from '../dto/update-homework.dto';
import { EmailService } from '../../internal-communication/email.service';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { PushNotificationService } from '../../notifications/services/push-notification.service';
import moment from 'moment';

@Injectable()
export class HomeworkService {
    constructor(
        @InjectRepository(Homework)
        private readonly homeworkRepository: Repository<Homework>,
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
        @InjectRepository(HomeworkSubmission)
        private readonly submissionRepository: Repository<HomeworkSubmission>,
        private readonly emailService: EmailService,
        private readonly systemSettingsService: SystemSettingsService,
        private readonly pushService: PushNotificationService,
    ) {}

    async create(createDto: CreateHomeworkDto, tenantId: string, currentUser?: any): Promise<Homework> {
        // Resolve teacherId: mobile app or clients may pass user.id instead of staff.id
        createDto.teacherId = await this.resolveStaffTeacherId(createDto.teacherId, currentUser, tenantId);

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
                relations: ['parent'],
            });

            console.log(`HomeworkService: Found ${students.length} students to notify for class ${homework.classId}`);

            const dueDate = moment(homework.dueDate).format('Do MMM YYYY');
            const subject = `New Homework Assigned: ${homework.title}`;
            const title = `New Assignment for ${homework.subject?.name || 'your class'}`;

            let skipped = 0;
            const studentUserIds: string[] = [];
            for (const student of students) {
                if (student.userId) studentUserIds.push(student.userId);

                const recipient = this.resolveNotificationRecipient(student);
                if (!recipient) {
                    skipped++;
                    console.log(`HomeworkService: Student ${student.firstName} has no email (and no guardian email), skipping.`);
                    continue;
                }

                // When we fall back to a guardian, address the guardian and name the child.
                const greeting = recipient.isStudent
                    ? `Hello ${student.firstName || 'Student'},`
                    : `Hello,`;
                const intro = recipient.isStudent
                    ? `A new homework assignment has been posted for your class.`
                    : `A new homework assignment has been posted for ${student.firstName || 'your child'}'s class.`;
                const closing = recipient.isStudent
                    ? `<em>Remember to submit your work before the deadline.</em>`
                    : `<em>Kindly ensure ${student.firstName || 'your child'} submits the work before the deadline.</em>`;

                const message = `
                    ${greeting}<br/><br/>
                    ${intro}<br/><br/>
                    <strong>Title:</strong> ${homework.title}<br/>
                    <strong>Subject:</strong> ${homework.subject?.name || 'N/A'}<br/>
                    <strong>Due Date:</strong> ${dueDate}<br/><br/>
                    Please log in to the portal to view the details and download any attachments.<br/><br/>
                    ${closing}
                `;

                console.log(`HomeworkService: Attempting to send email to ${recipient.email} (${recipient.isStudent ? 'student' : 'guardian'})`);
                const sent = await this.emailService.sendNotificationEmail(recipient.email, subject, message, title);
                console.log(`HomeworkService: Email to ${recipient.email} ${sent ? 'SUCCESS' : 'FAILED'}`);
            }
            if (studentUserIds.length) {
                this.pushService.sendToUserIds(studentUserIds, {
                    title: `New Homework: ${homework.title}`,
                    body: `${homework.subject?.name || 'A subject'} • Due ${dueDate}`,
                    data: { type: 'homework', homeworkId: homework.id },
                }).catch((err) => console.error('Failed to push-notify homework:', err));
            }
            if (skipped > 0) {
                console.log(`HomeworkService: ${skipped} student(s) had no reachable email (student or guardian).`);
            }
        } catch (error) {
            console.error('Error in notifyStudents (Homework):', error);
        }
    }

    /**
     * Resolve who to email for a student: the student's own address if set,
     * otherwise fall back to the primary guardian (guardian → father → mother),
     * checking both the student record and the linked parent record.
     */
    private resolveNotificationRecipient(student: any): { email: string; isStudent: boolean } | null {
        const clean = (v?: string) => {
            const t = (v || '').trim();
            return t && t.includes('@') ? t : '';
        };

        const studentEmail = clean(student.email);
        if (studentEmail) return { email: studentEmail, isStudent: true };

        const guardianEmail =
            clean(student.guardianEmail) ||
            clean(student.fatherEmail) ||
            clean(student.motherEmail) ||
            clean(student.parent?.guardianEmail) ||
            clean(student.parent?.fatherEmail) ||
            clean(student.parent?.motherEmail);

        return guardianEmail ? { email: guardianEmail, isStudent: false } : null;
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

    async update(id: string, updateDto: UpdateHomeworkDto, tenantId: string, currentUser?: any): Promise<Homework> {
        if (updateDto.teacherId) {
            updateDto.teacherId = await this.resolveStaffTeacherId(updateDto.teacherId, currentUser, tenantId);
        }
        const homework = await this.findOne(id, tenantId);
        Object.assign(homework, updateDto);
        return await this.homeworkRepository.save(homework);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const homework = await this.findOne(id, tenantId);
        await this.homeworkRepository.remove(homework);
    }

    /**
     * Resolves the teacher identifier to a valid Staff.id.
     * Clients (like the mobile app) might pass the authenticated user's ID (from users table)
     * instead of the staff table ID, which violates the homework.teacherId foreign key constraint.
     */
    private async resolveStaffTeacherId(teacherId: string | undefined, user: any, tenantId: string): Promise<string> {
        // 1. Check if teacherId is already a valid Staff.id in this tenant
        if (teacherId) {
            const staff = await this.staffRepository.findOne({ where: { id: teacherId, tenantId } });
            if (staff) return staff.id;
        }

        // 2. If user email is present, look up Staff by email
        if (user?.email) {
            const staff = await this.staffRepository.findOne({ where: { email: user.email, tenantId } });
            if (staff) return staff.id;
        }

        // 3. If teacherId was passed as a User ID, look up Staff via users table email match
        if (teacherId) {
            const staffByUser = await this.staffRepository.manager.query(
                `SELECT s.id FROM "staff" s 
                 JOIN "users" u ON LOWER(u.email) = LOWER(s.email) 
                 WHERE u.id = $1 AND s."tenantId" = $2 LIMIT 1`,
                [teacherId, tenantId]
            );
            if (staffByUser && staffByUser.length > 0) {
                return staffByUser[0].id;
            }
        }

        // 4. If current user's ID can be mapped to Staff via email
        if (user?.id) {
            const staffByUser = await this.staffRepository.manager.query(
                `SELECT s.id FROM "staff" s 
                 JOIN "users" u ON LOWER(u.email) = LOWER(s.email) 
                 WHERE u.id = $1 AND s."tenantId" = $2 LIMIT 1`,
                [user.id, tenantId]
            );
            if (staffByUser && staffByUser.length > 0) {
                return staffByUser[0].id;
            }
        }

        // 5. If teacherId was supplied, return as-is (database or validator will handle)
        if (teacherId) return teacherId;

        throw new BadRequestException('A valid teacher must be assigned to this homework.');
    }
}
