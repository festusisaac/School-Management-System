import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { Student } from '../../students/entities/student.entity';
import { ExamGroup } from '../entities/exam-group.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';
import { GradeScale } from '../entities/grade-scale.entity';

@Injectable()
export class TranscriptService {
    constructor(
        @InjectRepository(ExamResult)
        private examResultRepo: Repository<ExamResult>,
        @InjectRepository(StudentTermResult)
        private termResultRepo: Repository<StudentTermResult>,
        @InjectRepository(Student)
        private studentRepo: Repository<Student>,
        @InjectRepository(GradeScale)
        private gradeScaleRepo: Repository<GradeScale>,
    ) {}

    async getStudentTranscript(studentId: string, tenantId: string) {
        // 1. Verify student exists
        const student = await this.studentRepo.findOne({
            where: { id: studentId, tenantId },
            relations: ['class', 'section', 'deactivateReason']
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // 2. Fetch all term summaries for this student
        const termResults = await this.termResultRepo.find({
            where: { studentId, tenantId },
            relations: ['session', 'examGroup'],
            order: { createdAt: 'ASC' }
        });

        // 3. Fetch all individual subject scores across all sessions
        const subjectScoresRaw = await this.examResultRepo
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.exam', 'exam')
            .leftJoinAndSelect('exam.subject', 'subject')
            .leftJoinAndSelect('exam.examGroup', 'group')
            .leftJoinAndSelect('result.session', 'session')
            .where('result.studentId = :studentId', { studentId })
            .andWhere('result.tenantId = :tenantId', { tenantId })
            .orderBy('session.name', 'ASC')
            .addOrderBy('group.startDate', 'ASC')
            .getMany();

        // 4. Fetch Grade Scale
        const gradeScale = await this.gradeScaleRepo.findOne({
            where: { tenantId, isActive: true }
        });

        // 5. Aggregate into hierarchical structure: Session -> Term -> Subjects
        const transcript: any[] = [];
        const sessionMap = new Map<string, any>();

        subjectScoresRaw.forEach(res => {
            const sessionId = res.sessionId;
            const sessionName = res.session?.name || 'Unknown Session';
            const termId = res.exam?.examGroupId;
            const termName = res.exam?.examGroup?.term || 'Unknown Term';
            const subjectId = res.exam?.subjectId;
            const subjectName = res.exam?.subject?.name || 'Unknown Subject';

            if (!sessionId || !termId || !subjectId) return;

            // Get or create session entry
            if (!sessionMap.has(sessionId)) {
                const sessionEntry = {
                    id: sessionId,
                    name: sessionName,
                    terms: new Map<string, any>()
                };
                sessionMap.set(sessionId, sessionEntry);
                transcript.push(sessionEntry);
            }

            const sessionEntry = sessionMap.get(sessionId);

            // Get or create term entry
            if (!sessionEntry.terms.has(termId)) {
                const termSummary = termResults.find(tr => tr.examGroupId === termId);
                sessionEntry.terms.set(termId, {
                    id: termId,
                    name: termName,
                    summary: termSummary ? {
                        totalScore: termSummary.totalScore,
                        averageScore: termSummary.averageScore,
                        position: termSummary.position,
                        totalStudents: termSummary.totalStudents,
                        status: termSummary.status
                    } : null,
                    subjects: new Map<string, any>()
                });
            }

            const termEntry = sessionEntry.terms.get(termId);

            // Aggregate subject scores (handling multiple assessments per subject)
            if (!termEntry.subjects.has(subjectId)) {
                termEntry.subjects.set(subjectId, {
                    id: subjectId,
                    name: subjectName,
                    totalScore: 0,
                    grade: '',
                    remark: ''
                });
            }

            const subjectEntry = termEntry.subjects.get(subjectId);
            subjectEntry.totalScore += res.score;
        });

        // 6. Post-process to calculate grades and convert Maps to Arrays
        transcript.forEach(session => {
            session.terms = Array.from(session.terms.values());
            session.terms.forEach((term: any) => {
                term.subjects = Array.from(term.subjects.values());

                // Calculate missing summary data on-the-fly if not provided by processed results
                if (!term.summary || term.summary.averageScore === 0) {
                    const validSubjects = term.subjects.filter((s: any) => s.totalScore > 0);
                    const totalScore = validSubjects.reduce((sum: number, s: any) => sum + s.totalScore, 0);
                    const averageScore = validSubjects.length > 0 ? totalScore / validSubjects.length : 0;
                    
                    term.summary = {
                        ...(term.summary || {}),
                        totalScore: totalScore,
                        averageScore: averageScore,
                        status: term.summary?.status || 'DRAFT'
                    };
                }

                term.subjects.forEach((subject: any) => {
                    // Calculate Grade
                    if (gradeScale && gradeScale.grades) {
                        const match = gradeScale.grades.find(g => subject.totalScore >= g.minScore && subject.totalScore <= g.maxScore);
                        if (match) {
                            subject.grade = match.name;
                            subject.remark = match.remark;
                        }
                    }
                });
            });
        });

        return {
            student,
            transcript
        };
    }
}
