import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../entities/exam.entity';
import { Student } from '../../students/entities/student.entity';
import { CbtQuestion } from '../entities/cbt-question.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class CbtManifestService {
    constructor(
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(Student)
        private studentRepository: Repository<Student>,
        @InjectRepository(CbtQuestion)
        private questionRepository: Repository<CbtQuestion>,
    ) { }

    async generateSyncKey(examId: string, tenantId: string): Promise<string> {
        const exam = await this.examRepository.findOne({ where: { id: examId, tenantId } });
        if (!exam) {
            throw new NotFoundException('Exam not found');
        }

        const syncKey = `${examId.substring(0, 8).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
        exam.syncKey = syncKey;
        await this.examRepository.save(exam);

        return syncKey;
    }

    async getManifest(syncKey: string) {
        const exam = await this.examRepository.findOne({
            where: { syncKey },
            relations: ['subject', 'class', 'examGroup']
        });

        if (!exam) {
            throw new NotFoundException('Invalid Sync Key');
        }

        // Get active students for that class
        const students = await this.studentRepository.find({
            where: { classId: exam.classId, isActive: true, tenantId: exam.tenantId },
            select: ['id', 'admissionNo', 'firstName', 'lastName', 'middleName', 'gender']
        });

        // Get Questions
        const questions = await this.questionRepository.find({
            where: { examId: exam.id, tenantId: exam.tenantId },
            relations: ['options']
        });

        // Strip correct answers
        const secureQuestions = questions.map(q => ({
            id: q.id,
            content: q.content,
            marks: q.marks,
            options: q.options.map(o => ({
                id: o.id,
                content: o.content
            }))
        }));

        return {
            exam: {
                id: exam.id,
                name: exam.name,
                subject: exam.subject?.name,
                className: exam.class?.name,
                totalMarks: exam.totalMarks,
                durationMinutes: 60, // Default duration, or map from another field if you have it
                tenantId: exam.tenantId,
            },
            students: students.map(s => ({
                id: s.id,
                admissionNo: s.admissionNo,
                fullName: `${s.firstName} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName}`.trim(),
            })),
            questions: secureQuestions
        };
    }
}
