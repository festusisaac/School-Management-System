import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { Exam } from '../entities/exam.entity';
import { Student } from '../../students/entities/student.entity';
import { CbtQuestion } from '../entities/cbt-question.entity';
import { randomBytes } from 'crypto';

import { ExamSchedule } from '../entities/exam-schedule.entity';
import { AssessmentType } from '../entities/assessment-type.entity';

@Injectable()
export class CbtManifestService {
    constructor(
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(Student)
        private studentRepository: Repository<Student>,
        @InjectRepository(CbtQuestion)
        private questionRepository: Repository<CbtQuestion>,
        @InjectRepository(ExamSchedule)
        private scheduleRepository: Repository<ExamSchedule>,
        @InjectRepository(AssessmentType)
        private assessmentTypeRepository: Repository<AssessmentType>,
    ) { }

    private async getMarksValidationPayload(examId: string, tenantId: string, assessmentTypeId?: string) {
        const exam = await this.examRepository.findOne({
            where: { id: examId, tenantId },
            relations: ['examGroup']
        });
        if (!exam) {
            throw new NotFoundException('Exam not found');
        }

        let requiredMarks = exam.totalMarks || 0;
        let source = 'exam.totalMarks';
        let resolvedAssessmentTypeId: string | undefined = assessmentTypeId || exam.cbtAssessmentTypeId || undefined;
        let assessmentTypeName: string | undefined;

        if (resolvedAssessmentTypeId) {
            const assessment = await this.assessmentTypeRepository.findOne({
                where: { id: resolvedAssessmentTypeId, tenantId }
            });
            if (!assessment) {
                throw new NotFoundException('Selected assessment type not found');
            }
            requiredMarks = Number(assessment.maxMarks || 0);
            assessmentTypeName = assessment.name;
            source = 'assessmentType.maxMarks';
        }

        const questions = await this.questionRepository.find({
            where: { examId, tenantId },
            select: ['id', 'marks']
        });
        const currentMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
        const difference = currentMarks - requiredMarks;

        return {
            examId,
            examName: exam.name,
            assessmentTypeId: resolvedAssessmentTypeId,
            assessmentTypeName,
            marksSource: source,
            requiredMarks,
            currentMarks,
            difference,
            questionCount: questions.length,
            isValid: difference === 0
        };
    }

    async getMarksValidation(examId: string, tenantId: string, assessmentTypeId?: string) {
        return this.getMarksValidationPayload(examId, tenantId, assessmentTypeId);
    }

    async generateSyncKey(examId: string, tenantId: string, assessmentTypeId?: string): Promise<string> {
        const exam = await this.examRepository.findOne({ where: { id: examId, tenantId } });
        if (!exam) {
            throw new NotFoundException('Exam not found');
        }

        const marksValidation = await this.getMarksValidationPayload(examId, tenantId, assessmentTypeId);
        if (!marksValidation.isValid) {
            const direction = marksValidation.difference > 0 ? 'exceeds' : 'is below';
            throw new BadRequestException(
                `CBT question total (${marksValidation.currentMarks}) ${direction} required assessment marks (${marksValidation.requiredMarks}) by ${Math.abs(marksValidation.difference)}.`
            );
        }

        const syncKey = `${examId.substring(0, 8).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
        exam.syncKey = syncKey;
        if (assessmentTypeId) {
            exam.cbtAssessmentTypeId = assessmentTypeId;
        }
        await this.examRepository.save(exam);

        return syncKey;
    }

    async getManifest(syncKey: string) {
        const exam = await this.examRepository.findOne({
            where: { syncKey: Raw(alias => `UPPER(${alias}) = :key`, { key: syncKey.toUpperCase() }) },
            relations: ['subject', 'class', 'examGroup']
        });

        if (!exam) {
            throw new NotFoundException('Invalid Sync Key');
        }

        // Get Schedule for this exam
        const schedule = await this.scheduleRepository.findOne({
            where: { examId: exam.id, tenantId: exam.tenantId },
            order: { date: 'DESC' } // Pick the most recent/current setup
        });

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

        // Use the explicitly mapped assessment type if available
        const assessmentTypeId = exam.cbtAssessmentTypeId || undefined;

        return {
            exam: {
                id: exam.id,
                name: exam.name,
                subject: exam.subject?.name,
                className: exam.class?.name,
                totalMarks: exam.totalMarks,
                durationMinutes: 60, 
                startTime: schedule?.startTime,
                endTime: schedule?.endTime,
                examDate: schedule?.date,
                tenantId: exam.tenantId,
                assessmentTypeId: assessmentTypeId
            },
            students: students.map(s => ({
                id: s.id,
                admissionNo: s.admissionNo,
                fullName: `${s.firstName} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName}`.trim(),
            })),
            questions: secureQuestions
        };
    }
    async gradeCbtPayload(syncKey: string, payload: any[]) {
        const exam = await this.examRepository.findOne({
            where: { syncKey: Raw(alias => `UPPER(${alias}) = :key`, { key: syncKey.toUpperCase() }) }
        });

        if (!exam) {
            throw new NotFoundException('Invalid Sync Key for grading');
        }

        // Get questions with options (including correct answers)
        const questions = await this.questionRepository.find({
            where: { examId: exam.id, tenantId: exam.tenantId },
            relations: ['options']
        });

        const correctMap: Record<string, { optionId: string, marks: number }> = {};
        questions.forEach(q => {
            const correctOption = q.options.find(o => o.isCorrect === true);
            if (correctOption) {
                correctMap[q.id] = { optionId: correctOption.id, marks: q.marks };
            }
        });

        // Grade the payload
        const gradedPayload = payload.map(item => {
            let totalScore = 0;
            const answers = item.answers || {};

            for (const [questionId, selectedOptionId] of Object.entries(answers)) {
                const correctData = correctMap[questionId];
                if (correctData && correctData.optionId === selectedOptionId) {
                    totalScore += correctData.marks || 1;
                }
            }

            return {
                ...item,
                score: totalScore
            };
        });

        return gradedPayload;
    }
}
