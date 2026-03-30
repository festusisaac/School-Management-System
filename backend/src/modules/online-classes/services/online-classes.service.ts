import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnlineClass, OnlineClassStatus } from '../entities/online-class.entity';
import { CreateOnlineClassDto } from '../dto/create-online-class.dto';
import { UpdateOnlineClassDto } from '../dto/update-online-class.dto';
import { EmailService } from '../../internal-communication/email.service';
import { Student } from '../../students/entities/student.entity';
import moment from 'moment';
@Injectable()
export class OnlineClassesService {
    constructor(
        @InjectRepository(OnlineClass)
        private readonly onlineClassRepository: Repository<OnlineClass>,
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        private readonly emailService: EmailService,
    ) {}

    async create(createDto: CreateOnlineClassDto, tenantId: string): Promise<OnlineClass> {
        const onlineClass = this.onlineClassRepository.create({
            ...createDto,
            tenantId,
        });
        const savedClass = await this.onlineClassRepository.save(onlineClass);

        // Fetch the class with relations for the email
        const fullClass = await this.findOne(savedClass.id, tenantId);

        // Notify students in the class
        this.notifyStudents(fullClass, tenantId).catch(err => {
            console.error('Failed to notify students:', err);
        });

        return savedClass;
    }

    private async notifyStudents(onlineClass: OnlineClass, tenantId: string) {
        try {
            const students = await this.studentRepository.find({
                where: { classId: onlineClass.classId, tenantId, isActive: true },
                select: ['email', 'firstName']
            });

            const startTime = moment(onlineClass.startTime).format('Do MMM YYYY, h:mm a');
            const endTime = moment(onlineClass.endTime).format('h:mm a');
            const subject = `New Online Class Scheduled: ${onlineClass.title}`;
            const title = `Virtual Classroom invitation`;

            for (const student of students) {
                if (!student.email) continue;

                const message = `
                    Hello ${student.firstName || 'Student'},<br/><br/>
                    A new online class has been scheduled for your class.<br/><br/>
                    <strong>Class:</strong> ${onlineClass.title}<br/>
                    <strong>Subject:</strong> ${onlineClass.subject?.name || 'N/A'}<br/>
                    <strong>Time:</strong> ${startTime} - ${endTime}<br/>
                    <strong>Platform:</strong> ${onlineClass.platform}<br/><br/>
                    You can join the class by clicking the link below:<br/>
                    <a href="${onlineClass.meetingUrl}" style="color: #4F46E5; font-weight: bold;">Join Meeting Now</a><br/><br/>
                    <em>Please ensure you join at least 5 minutes before the start time.</em>
                `;

                await this.emailService.sendNotificationEmail(student.email, subject, message, title);
            }
        } catch (error) {
            console.error('Error in notifyStudents:', error);
        }
    }

    async findAll(tenantId: string, filters: { classId?: string; subjectId?: string; teacherId?: string; status?: OnlineClassStatus }): Promise<OnlineClass[]> {
        const query = this.onlineClassRepository.createQueryBuilder('oc')
            .leftJoinAndSelect('oc.class', 'class')
            .leftJoinAndSelect('oc.subject', 'subject')
            .leftJoinAndSelect('oc.teacher', 'teacher')
            .where('oc.tenantId = :tenantId', { tenantId });

        if (filters.classId) {
            query.andWhere('oc.classId = :classId', { classId: filters.classId });
        }
        if (filters.subjectId) {
            query.andWhere('oc.subjectId = :subjectId', { subjectId: filters.subjectId });
        }
        if (filters.teacherId) {
            query.andWhere('oc.teacherId = :teacherId', { teacherId: filters.teacherId });
        }
        if (filters.status) {
            if (filters.status === OnlineClassStatus.COMPLETED) {
                // Return both explicitly completed and naturally ended classes
                query.andWhere('(oc.status = :status OR oc.endTime <= :now)', { 
                    status: filters.status, 
                    now: new Date() 
                });
            } else {
                query.andWhere('oc.status = :status AND oc.endTime > :now', { 
                    status: filters.status, 
                    now: new Date() 
                });
            }
        }

        return await query.orderBy('oc.startTime', 'ASC').getMany();
    }

    async findOne(id: string, tenantId: string): Promise<OnlineClass> {
        const onlineClass = await this.onlineClassRepository.findOne({
            where: { id, tenantId },
            relations: ['class', 'subject', 'teacher'],
        });

        if (!onlineClass) {
            throw new NotFoundException(`Online class with ID ${id} not found`);
        }

        return onlineClass;
    }

    async update(id: string, updateDto: UpdateOnlineClassDto, tenantId: string): Promise<OnlineClass> {
        const onlineClass = await this.findOne(id, tenantId);
        Object.assign(onlineClass, updateDto);
        return await this.onlineClassRepository.save(onlineClass);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const onlineClass = await this.findOne(id, tenantId);
        await this.onlineClassRepository.remove(onlineClass);
    }

    async findUpcoming(tenantId: string, classId?: string, teacherId?: string): Promise<OnlineClass[]> {
        const query = this.onlineClassRepository.createQueryBuilder('oc')
            .leftJoinAndSelect('oc.class', 'class')
            .leftJoinAndSelect('oc.subject', 'subject')
            .leftJoinAndSelect('oc.teacher', 'teacher')
            .where('oc.tenantId = :tenantId', { tenantId })
            .andWhere('oc.endTime > :now', { now: new Date() })
            .andWhere('oc.status IN (:...statuses)', { statuses: [OnlineClassStatus.SCHEDULED, OnlineClassStatus.IN_PROGRESS] });

        if (classId) {
            query.andWhere('oc.classId = :classId', { classId });
        }

        if (teacherId) {
            query.andWhere('oc.teacherId = :teacherId', { teacherId });
        }

        return await query.orderBy('oc.startTime', 'ASC').getMany();
    }
}
