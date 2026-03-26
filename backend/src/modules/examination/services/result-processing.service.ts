import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, Between } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { ProcessResultDto, BulkPublishDto } from '../dtos/processing/processing.dto';
import { GradeScale } from '../entities/grade-scale.entity';
import { Exam } from '../entities/exam.entity';

import { ExamGroup } from '../entities/exam-group.entity';
import { StudentAttendance, AttendanceStatus } from '../../students/entities/student-attendance.entity';

import { AcademicTerm } from '../../system/entities/academic-term.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Injectable()
export class ResultProcessingService {
    constructor(
        @InjectRepository(ExamResult)
        private examResultRepo: Repository<ExamResult>,
        @InjectRepository(StudentTermResult)
        private termResultRepo: Repository<StudentTermResult>,
        @InjectRepository(GradeScale)
        private gradeScaleRepo: Repository<GradeScale>,
        @InjectRepository(Exam)
        private examRepo: Repository<Exam>,
        @InjectRepository(StudentAttendance)
        private attendanceRepo: Repository<StudentAttendance>,
    ) { }

    async processResults(dto: ProcessResultDto, tenantId: string) {
        // 1. Aggregate scores per student (Simple Sum)
        
        // --- Added: Fetch all students in the class to ensure everyone is processed ---
        const allStudents = await this.examResultRepo.manager.getRepository('Student').find({
            where: { classId: dto.classId, tenantId },
            select: ['id']
        });
        const aggregationMap = new Map();
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
        for (const res of aggregation) {
            aggregationMap.set(res.studentId, res);
        }

        // 2. Save to StudentTermResult
        
        // --- Fetch Context: Group and Term Settings ---
        const currentGroup = await this.examResultRepo.manager.getRepository(ExamGroup).findOne({ 
            where: { id: dto.examGroupId, tenantId } 
        });

        let termDaysOpened = 0;
        if (currentGroup) {
            const termDetails = await this.examResultRepo.manager.getRepository(AcademicTerm).findOne({
                where: { 
                    name: currentGroup.term,
                    session: { name: currentGroup.academicYear }
                },
                relations: ['session']
            });
            termDaysOpened = termDetails?.daysOpened || 0;
        }

        for (const student of allStudents) {
            const record = aggregationMap.get(student.id) || { studentId: student.id, totalScore: 0, subjectCount: 0 };
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
            termResult.totalStudents = allStudents.length;

            
            // --- Synchronization: Pull Real Attendance Data ---
            try {
                const examGroup = await this.examResultRepo.manager.getRepository(ExamGroup).findOne({
                    where: { id: dto.examGroupId, tenantId }
                });

                if (examGroup) {
                    // 1. Calculate Days School Opened (Unique dates where attendance was taken for this class)
                    const attendanceDates = await this.attendanceRepo
                        .createQueryBuilder('attendance')
                        .select('DISTINCT(attendance.date)', 'date')
                        .where('attendance.classId = :classId', { classId: dto.classId })
                        .andWhere('attendance.date BETWEEN :start AND :end', {
                            start: new Date(examGroup.startDate).toISOString().split('T')[0],
                            end: new Date(examGroup.endDate).toISOString().split('T')[0]
                        })
                        .andWhere('attendance.tenantId = :tenantId', { tenantId })
                        .getRawMany();

                    const actualDaysOpened = attendanceDates.length;
                    // --- User Preference: Use fixed number from term settings if available ---
                    const daysOpened = termDaysOpened > 0 ? termDaysOpened : actualDaysOpened;

                    // 2. Calculate Student's Presence (present, late, halfday)
                    const presentCount = await this.attendanceRepo.count({
                        where: {
                            studentId: record.studentId,
                            classId: dto.classId,
                            date: Between(new Date(examGroup.startDate).toISOString().split('T')[0], new Date(examGroup.endDate).toISOString().split('T')[0]),
                            status: In([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.HALFDAY]),
                            tenantId
                        }
                    });

                    termResult.daysOpened = daysOpened;
                    termResult.daysPresent = presentCount;
                }
            } catch (err) {
                console.error(`Failed to sync attendance for student ${record.studentId}:`, err);
            }

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

        // 4. Calculate and Save Subject-Level Statistics (Performance Benchmarking)
        const subjectStatsRaw = await this.examResultRepo
            .createQueryBuilder('result')
            .leftJoin('result.exam', 'exam')
            .select('exam.id', 'examId')
            .addSelect('MAX(result.score)', 'highest')
            .addSelect('MIN(result.score)', 'lowest')
            .addSelect('AVG(result.score)', 'average')
            .where('exam.examGroupId = :groupId', { groupId: dto.examGroupId })
            .andWhere('exam.classId = :classId', { classId: dto.classId })
            .andWhere('result.tenantId = :tenantId', { tenantId })
            .groupBy('exam.id')
            .getRawMany();

        for (const stat of subjectStatsRaw) {
            await this.examRepo.update(stat.examId, {
                highestScore: parseFloat(stat.highest),
                lowestScore: parseFloat(stat.lowest),
                averageScore: parseFloat(stat.average)
            });
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
        const currentGroup = await this.examRepo.manager.getRepository(ExamGroup).findOne({ 
            where: { id: examGroupId, tenantId } 
        });

        // Fetch AcademicTerm details for school-wide settings
        let termDetails = null;
        if (currentGroup) {
            termDetails = await this.examRepo.manager.getRepository(AcademicTerm).findOne({
                where: { 
                    name: currentGroup.term,
                    session: { name: currentGroup.academicYear }
                },
                relations: ['session']
            });
        }

        const sortedOverallTotals = Array.from(studentOverallTotals.values()).sort((a, b) => b - a);
        const liveResults = allStudents.map(student => {
            const totalScore = studentOverallTotals.get(student.id) || 0;
            const position = sortedOverallTotals.indexOf(totalScore) + 1;
            const saved = savedResultsMap.get(student.id);
            
            // Map to a structure similar to StudentTermResult for frontend compatibility
            return {
                studentId: student.id,
                student,
                examGroup: currentGroup,
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

        // 7. Handle Cumulative Data for Third Term
        let cumulativeSubjectScores: any[] = [];
        let cumulativeOverallResults: any[] = [];
        
        // currentGroup is now fetched above
        if (currentGroup) {
            const termName = currentGroup?.term?.toLowerCase() || '';
            const isThirdTerm = termName.includes('third') || termName.includes('3rd');
            
            if (isThirdTerm) {
            const sessionsGroups = await this.examRepo.manager.getRepository(ExamGroup).find({
                where: { 
                    academicYear: currentGroup.academicYear, 
                    tenantId,
                    id: Not(examGroupId)
                }
            });

            const prevGroupIds = sessionsGroups
                .filter(g => {
                    const t = g.term?.toLowerCase() || '';
                    return t.includes('first') || t.includes('1st') || t.includes('second') || t.includes('2nd');
                })
                .map(g => g.id);

            if (prevGroupIds.length > 0) {
                // For Subject Broadsheet
                cumulativeSubjectScores = await this.examResultRepo
                    .createQueryBuilder('result')
                    .leftJoin('result.exam', 'exam')
                    .leftJoin('exam.examGroup', 'group')
                    .select('result.studentId', 'studentId')
                    .addSelect('exam.subjectId', 'subjectId')
                    .addSelect('group.term', 'term')
                    .addSelect('SUM(result.score)', 'termTotal')
                    .where('exam.examGroupId IN (:...prevGroupIds)', { prevGroupIds })
                    .andWhere('exam.classId = :classId', { classId })
                    .andWhere('result.tenantId = :tenantId', { tenantId })
                    .groupBy('result.studentId')
                    .addGroupBy('exam.subjectId')
                    .addGroupBy('group.term')
                    .getRawMany();
                
                // For Class Broadsheet
                cumulativeOverallResults = await this.termResultRepo.find({
                    where: { 
                        examGroupId: In(prevGroupIds),
                        classId,
                        tenantId
                    },
                    relations: ['examGroup']
                });
            }
        }
    }

    return {
            results: liveResults,
            subjectScores: enrichedSubjectScores,
            subjectStats,
            cumulativeSubjectScores,
            cumulativeOverallResults,
            termDetails
        };
    }

    async getStudentReportCardData(studentId: string, examGroupId: string, tenantId: string) {
        // 1. Fetch current summary and groups info
        const currentGroup = await this.examRepo.manager.getRepository(ExamGroup).findOne({ where: { id: examGroupId, tenantId } });
        const summary = await this.termResultRepo.findOne({
            where: { studentId, examGroupId, tenantId },
            relations: ['examGroup']
        });

        const termDetails = await this.examRepo.manager.getRepository(AcademicTerm).findOne({
            where: { 
                name: currentGroup?.term,
                session: { name: currentGroup?.academicYear }
            },
            relations: ['session']
        });

        if (!summary) return null;

        // 2. Cumulative logic for Report Card
        let cumulativeSummary: any[] = [];
        let cumulativeSubjectScores: any[] = [];

        const termName = currentGroup?.term?.toLowerCase() || '';
        const isThirdTerm = termName.includes('third') || termName.includes('3rd');

        if (isThirdTerm && currentGroup) {
            const sessionsGroups = await this.examRepo.manager.getRepository(ExamGroup).find({
                where: { academicYear: currentGroup.academicYear, tenantId, id: Not(examGroupId) }
            });
            const prevGroupIds = sessionsGroups
                .filter(g => {
                    const t = g.term?.toLowerCase() || '';
                    return t.includes('first') || t.includes('1st') || t.includes('second') || t.includes('2nd');
                })
                .map(g => g.id);

            if (prevGroupIds.length > 0) {
                cumulativeSummary = await this.termResultRepo.find({
                    where: { studentId, examGroupId: In(prevGroupIds), tenantId },
                    relations: ['examGroup']
                });

                cumulativeSubjectScores = await this.examResultRepo
                    .createQueryBuilder('result')
                    .leftJoin('result.exam', 'exam')
                    .leftJoin('exam.examGroup', 'group')
                    .select('exam.subjectId', 'subjectId')
                    .addSelect('group.term', 'term')
                    .addSelect('SUM(result.score)', 'termTotal')
                    .where('result.studentId = :studentId', { studentId })
                    .andWhere('exam.examGroupId IN (:...prevGroupIds)', { prevGroupIds })
                    .andWhere('result.tenantId = :tenantId', { tenantId })
                    .groupBy('exam.subjectId')
                    .addGroupBy('group.term')
                    .getRawMany();
            }
        }

        // 3. Fetch Exams and scores for current term
        const exams = await this.examRepo.find({
            where: { examGroupId, tenantId },
            relations: ['subject']
        });

        // 3. Fetch student's individual marks (aggregated by subject)
        const subjectScoresRaw = await this.examResultRepo
            .createQueryBuilder('result')
            .leftJoin('result.exam', 'exam')
            .select('exam.subjectId', 'subjectId')
            .addSelect('SUM(result.score)', 'totalSubjectScore')
            .where('result.studentId = :studentId', { studentId })
            .andWhere('exam.examGroupId = :examGroupId', { examGroupId })
            .andWhere('result.tenantId = :tenantId', { tenantId })
            .groupBy('exam.subjectId')
            .getRawMany();

        // 4. Fetch grade scale
        const gradeScale = await this.gradeScaleRepo.findOne({
            where: { tenantId, isActive: true }
        });

        // 5. Map into the final format
        const subjectScores = subjectScoresRaw.map(s => {
            const score = parseFloat(s.totalSubjectScore);
            const exam = exams.find(e => e.subjectId === s.subjectId);
            
            let grade = '-';
            let remark = '-';
            if (gradeScale && (gradeScale as any).grades) {
                const match = (gradeScale as any).grades.find((g: any) => score >= g.minScore && score <= g.maxScore);
                if (match) {
                    grade = match.name;
                    remark = match.remark || '';
                }
            }

            return {
                subjectId: s.subjectId,
                subject: exam?.subject,
                totalScore: score,
                grade,
                remark,
                highestInClass: exam?.highestScore,
                lowestInClass: exam?.lowestScore,
                classAvg: exam?.averageScore
            };
        });

        return {
            summary,
            subjectScores,
            subjectStats: exams.map(e => ({
                subjectId: e.subjectId,
                highestScore: e.highestScore,
                lowestScore: e.lowestScore,
                averageScore: e.averageScore
            })),
            cumulativeSummary,
            cumulativeSubjectScores,
            termDetails: {
                daysOpened: termDetails?.daysOpened,
                nextTermStartDate: termDetails?.nextTermStartDate
            }
        };
    }

    async bulkPublishResults(dto: BulkPublishDto, tenantId: string) {
        await this.termResultRepo.update(
            { 
                examGroupId: dto.examGroupId, 
                classId: dto.classId, 
                tenantId 
            },
            { status: dto.status }
        );
        return { message: `Successfully ${dto.status.toLowerCase()} results for the class.` };
    }
}
