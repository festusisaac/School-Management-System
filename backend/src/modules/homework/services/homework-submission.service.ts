import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeworkSubmission, SubmissionStatus } from '../entities/submission.entity';
import { Homework } from '../entities/homework.entity';
import { Student } from '../../students/entities/student.entity';
import { SubmitHomeworkDto, GradeSubmissionDto } from '../dto/submit-homework.dto';

@Injectable()
export class HomeworkSubmissionService {
    constructor(
        @InjectRepository(HomeworkSubmission)
        private readonly submissionRepository: Repository<HomeworkSubmission>,
        @InjectRepository(Homework)
        private readonly homeworkRepository: Repository<Homework>,
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
    ) {}

    async resolveStudentId(studentIdOrUserId: string, tenantId: string): Promise<string> {
        const student = await this.studentRepository.findOne({
            where: [
                { id: studentIdOrUserId, tenantId },
                { userId: studentIdOrUserId, tenantId }
            ]
        });

        if (!student) {
            throw new NotFoundException('Student record not found. Please ensure your profile is correctly linked.');
        }

        return student.id;
    }

    async submit(dto: SubmitHomeworkDto, studentIdOrUserId: string, tenantId: string) {
        const actualStudentId = await this.resolveStudentId(studentIdOrUserId, tenantId);

        const homework = await this.homeworkRepository.findOne({
            where: { id: dto.homeworkId, tenantId }
        });

        if (!homework) {
            throw new NotFoundException('Homework not found');
        }

        // Check if already submitted
        const existing = await this.submissionRepository.findOne({
            where: { homeworkId: dto.homeworkId, studentId: actualStudentId, tenantId }
        });

        if (existing) {
            // Update existing submission
            return this.submissionRepository.save({
                ...existing,
                content: dto.content,
                attachmentUrls: dto.attachmentUrls || existing.attachmentUrls,
                submittedAt: new Date(),
            });
        }

        const submission = this.submissionRepository.create({
            ...dto,
            studentId: actualStudentId,
            tenantId,
            status: SubmissionStatus.SUBMITTED,
        });

        return this.submissionRepository.save(submission);
    }

    async findByHomework(homeworkId: string, tenantId: string) {
        return this.submissionRepository.find({
            where: { homeworkId, tenantId },
            relations: ['student'],
            order: { submittedAt: 'DESC' }
        });
    }

    async findByStudent(studentId: string, tenantId: string) {
        return this.submissionRepository.find({
            where: { studentId, tenantId },
            relations: ['homework', 'homework.subject'],
            order: { submittedAt: 'DESC' }
        });
    }

    async findOne(id: string, tenantId: string) {
        const submission = await this.submissionRepository.findOne({
            where: { id, tenantId },
            relations: ['student', 'homework']
        });

        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        return submission;
    }

    async grade(id: string, dto: GradeSubmissionDto, tenantId: string) {
        const submission = await this.findOne(id, tenantId);
        
        submission.grade = dto.grade;
        submission.feedback = dto.feedback;
        submission.status = SubmissionStatus.GRADED;

        return this.submissionRepository.save(submission);
    }
}
