import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { ProcessResultDto } from '../dtos/processing/processing.dto';
import { GradeScale } from '../entities/grade-scale.entity';

@Injectable()
export class ResultProcessingService {
    constructor(
        @InjectRepository(ExamResult)
        private examResultRepo: Repository<ExamResult>,
        @InjectRepository(StudentTermResult)
        private termResultRepo: Repository<StudentTermResult>,
        @InjectRepository(GradeScale)
        private gradeScaleRepo: Repository<GradeScale>,
    ) { }

    async processResults(dto: ProcessResultDto, tenantId: string) {
        // 1. Aggregate scores per student (Simple Sum)
        const aggregation = await this.examResultRepo
            .createQueryBuilder('result')
            .leftJoin('result.exam', 'exam')
            .select('result.studentId', 'studentId')
            .addSelect('SUM(result.score)', 'totalScore')
            .addSelect('COUNT(DISTINCT exam.subjectId)', 'subjectCount')
            .where('exam.examGroupId = :groupId', { groupId: dto.examGroupId })
            .andWhere('exam.classId = :classId', { classId: dto.classId })
            .andWhere('result.tenantId = :tenantId', { tenantId })
            .groupBy('result.studentId')
            .getRawMany();

        // 2. Save to StudentTermResult
        for (const record of aggregation) {
            let termResult = await this.termResultRepo.findOne({
                where: {
                    studentId: record.studentId,
                    examGroupId: dto.examGroupId,
                    tenantId
                },
            });

            if (!termResult) {
                termResult = this.termResultRepo.create({
                    studentId: record.studentId,
                    examGroupId: dto.examGroupId,
                    classId: dto.classId,
                    tenantId
                });
            }

            const total = parseFloat(record.totalScore);
            const count = parseInt(record.subjectCount, 10);

            termResult.totalScore = total;
            termResult.averageScore = count > 0 ? total / count : 0;
            termResult.totalStudents = aggregation.length;

            await this.termResultRepo.save(termResult);
        }

        // 3. Calculate and Save Positions (Competition Ranking)
        const allResults = await this.termResultRepo.find({
            where: { examGroupId: dto.examGroupId, classId: dto.classId, tenantId },
            order: { totalScore: 'DESC' }
        });

        let currentRank = 1;
        for (let i = 0; i < allResults.length; i++) {
            if (i > 0 && allResults[i].totalScore < allResults[i - 1].totalScore) {
                currentRank = i + 1;
            }
            allResults[i].position = currentRank;
            await this.termResultRepo.save(allResults[i]);
        }

        return { message: 'Processing complete', studentsProcessed: aggregation.length };
    }

    async getBroadsheet(examGroupId: string, classId: string, tenantId: string) {
        // 1. Fetch academic info for the students in this class
        const allStudents = await this.examResultRepo.manager.getRepository('Student').find({
            where: { classId, tenantId },
            relations: ['class'],
            order: { firstName: 'ASC' }
        });

        // 2. Fetch all specific subject scores for all students in this class/group
        const subjectScoresRaw = await this.examResultRepo
            .createQueryBuilder('result')
            .leftJoin('result.exam', 'exam')
            .select('result.studentId', 'studentId')
            .addSelect('exam.subjectId', 'subjectId')
            .addSelect('SUM(result.score)', 'totalSubjectScore')
            .where('exam.examGroupId = :examGroupId', { examGroupId })
            .andWhere('exam.classId = :classId', { classId })
            .andWhere('result.tenantId = :tenantId', { tenantId })
            .groupBy('result.studentId')
            .addGroupBy('exam.subjectId')
            .getRawMany();

        // 3. Fetch grade scale for marking
        const gradeScale = await this.gradeScaleRepo.findOne({
            where: { tenantId, isActive: true }
        });

        // 4. Calculate everything on-the-fly
        const studentOverallTotals = new Map<string, number>();
        const subjectStatsMap = new Map<string, { high: number, low: number, sum: number, count: number, allScores: number[] }>();

        // First pass: accumulate subject stats and calculate student overall totals
        const tempScores = subjectScoresRaw.map(s => {
            const score = parseFloat(s.totalSubjectScore);
            const studentId = s.studentId;
            const subjectId = s.subjectId;

            // Student overall total (for class ranking)
            studentOverallTotals.set(studentId, (studentOverallTotals.get(studentId) || 0) + score);

            // Per-subject stats (for subject ranking and benchmarks)
            if (!subjectStatsMap.has(subjectId)) {
                subjectStatsMap.set(subjectId, { high: score, low: score, sum: score, count: 1, allScores: [score] });
            } else {
                const stat = subjectStatsMap.get(subjectId)!;
                stat.high = Math.max(stat.high, score);
                stat.low = Math.min(stat.low, score);
                stat.sum += score;
                stat.count += 1;
                stat.allScores.push(score);
            }

            return { ...s, totalSubjectScore: score };
        });

        // Second pass: Enrich subject scores with Grade, Remark, and POSITION IN SUBJECT
        const enrichedSubjectScores = tempScores.map(s => {
            const total = s.totalSubjectScore;
            const stats = subjectStatsMap.get(s.subjectId);
            
            // Competition Ranking for Subject
            let subjectPosition = 1;
            if (stats) {
                const sorted = [...stats.allScores].sort((a, b) => b - a);
                subjectPosition = sorted.indexOf(total) + 1;
            }

            let grade = 'F';
            let remark = 'VERY POOR';
            if (gradeScale && gradeScale.grades) {
                const match = gradeScale.grades.find(g => total >= g.minScore && total <= g.maxScore);
                if (match) {
                    grade = match.name;
                    remark = match.remark || '';
                }
            }

            return {
                ...s,
                positionInSubject: subjectPosition,
                grade,
                remark
            };
        });

        // 5. Fetch saved StudentTermResults to get actual status (PUBLISHED, DRAFT) and remarks
        const savedResults = await this.termResultRepo.find({
            where: { examGroupId, classId, tenantId }
        });
        const savedResultsMap = new Map(savedResults.map(r => [r.studentId, r]));

        // 6. Calculate CLASS POSITION dynamically and merge saved statuses
        const sortedOverallTotals = Array.from(studentOverallTotals.values()).sort((a, b) => b - a);
        const liveResults = allStudents.map(student => {
            const totalScore = studentOverallTotals.get(student.id) || 0;
            const position = sortedOverallTotals.indexOf(totalScore) + 1;
            const saved = savedResultsMap.get(student.id);
            
            // Map to a structure similar to StudentTermResult for frontend compatibility
            return {
                studentId: student.id,
                student,
                totalScore,
                averageScore: subjectStatsMap.size > 0 ? totalScore / subjectStatsMap.size : 0, // Approx avg
                position,
                status: saved ? saved.status : 'DRAFT',
                daysPresent: saved ? saved.daysPresent : 0,
                daysOpened: saved ? saved.daysOpened : 0,
                principalComment: saved?.principalComment || undefined,
                teacherComment: saved?.teacherComment || undefined,
            };
        });

        const subjectStats = Array.from(subjectStatsMap.entries()).map(([subjectId, s]) => ({
            subjectId,
            highestScore: s.high,
            lowestScore: s.low,
            averageScore: s.sum / s.count
        }));

        return {
            results: liveResults,
            subjectScores: enrichedSubjectScores,
            subjectStats
        };
    }
}
