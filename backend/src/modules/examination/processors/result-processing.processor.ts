import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, In } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { GradeScale } from '../entities/grade-scale.entity';
import { Exam } from '../entities/exam.entity';
import { ExamGroup } from '../entities/exam-group.entity';
import { StudentAttendance, AttendanceStatus } from '../../students/entities/student-attendance.entity';
import { AcademicTerm } from '../../system/entities/academic-term.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { ProcessResultDto } from '../dtos/processing/processing.dto';

@Processor('result-processing')
@Injectable()
export class ResultProcessingProcessor {
    private readonly logger = new Logger(ResultProcessingProcessor.name);

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
        private systemSettingsService: SystemSettingsService,
    ) { }

    @Process('process-class-results')
    async handleProcessClassResults(job: Job<{ dto: ProcessResultDto, tenantId: string }>) {
        const { dto, tenantId } = job.data;
        this.logger.log(`Starting background result processing for class ${dto.classId}, group ${dto.examGroupId}`);

        try {
            // 1. Aggregate scores per student (Simple Sum)
            const sessionId = await this.systemSettingsService.getActiveSessionId();
            
            const allStudents = await this.examResultRepo.manager.getRepository('Student').find({
                where: { classId: dto.classId, tenantId },
                select: ['id']
            });
            const aggregationMap = new Map();
            
            const aggregationQuery = this.examResultRepo
                .createQueryBuilder('result')
                .leftJoin('result.exam', 'exam')
                .select('result.studentId', 'studentId')
                .addSelect('SUM(result.score)', 'totalScore')
                .addSelect('COUNT(DISTINCT exam.subjectId)', 'subjectCount')
                .where('exam.examGroupId = :groupId', { groupId: dto.examGroupId })
                .andWhere('exam.classId = :classId', { classId: dto.classId })
                .andWhere('result.tenantId = :tenantId', { tenantId });
            
            if (sessionId) {
                aggregationQuery.andWhere('result.sessionId = :sessionId', { sessionId });
            }

            const aggregation = await aggregationQuery
                .groupBy('result.studentId')
                .getRawMany();

            for (const res of aggregation) {
                aggregationMap.set(res.studentId, res);
            }

            // 2. Save to StudentTermResult
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

            let processedCount = 0;
            for (const student of allStudents) {
                const record = aggregationMap.get(student.id) || { studentId: student.id, totalScore: 0, subjectCount: 0 };
                
                const termResultWhere: any = {
                    studentId: record.studentId,
                    examGroupId: dto.examGroupId,
                    tenantId
                };
                if (sessionId) termResultWhere.sessionId = sessionId;

                let termResult = await this.termResultRepo.findOne({
                    where: termResultWhere,
                });

                if (!termResult) {
                    termResult = this.termResultRepo.create({
                        studentId: record.studentId,
                        examGroupId: dto.examGroupId,
                        classId: dto.classId,
                        tenantId,
                        sessionId: sessionId || undefined
                    });
                }

                const total = parseFloat(record.totalScore);
                const count = parseInt(record.subjectCount, 10);

                termResult.totalScore = total;
                termResult.averageScore = count > 0 ? total / count : 0;
                termResult.totalStudents = allStudents.length;

                // Sync Attendance
                try {
                    const examGroup = await this.examResultRepo.manager.getRepository(ExamGroup).findOne({
                        where: { id: dto.examGroupId, tenantId }
                    });

                    if (examGroup) {
                        const attendanceQuery = this.attendanceRepo
                            .createQueryBuilder('attendance')
                            .select('DISTINCT(attendance.date)', 'date')
                            .where('attendance.classId = :classId', { classId: dto.classId })
                            .andWhere('attendance.date BETWEEN :start AND :end', {
                                start: new Date(examGroup.startDate).toISOString().split('T')[0],
                                end: new Date(examGroup.endDate).toISOString().split('T')[0]
                            })
                            .andWhere('attendance.tenantId = :tenantId', { tenantId });
                        
                        if (sessionId) {
                            attendanceQuery.andWhere('attendance.sessionId = :sessionId', { sessionId });
                        }

                        const attendanceDates = await attendanceQuery.getRawMany();
                        const actualDaysOpened = attendanceDates.length;
                        const daysOpened = termDaysOpened > 0 ? termDaysOpened : actualDaysOpened;

                        const presentCount = await this.attendanceRepo.count({
                            where: {
                                studentId: record.studentId,
                                classId: dto.classId,
                                date: Between(new Date(examGroup.startDate).toISOString().split('T')[0], new Date(examGroup.endDate).toISOString().split('T')[0]) as any,
                                status: In([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.HALFDAY]),
                                tenantId,
                                sessionId: sessionId || IsNull()
                            }
                        });

                        termResult.daysOpened = daysOpened;
                        termResult.daysPresent = presentCount;
                    }
                } catch (err) {
                    this.logger.error(`Failed to sync attendance for student ${record.studentId}:`, err);
                }

                await this.termResultRepo.save(termResult);
                
                processedCount++;
                await job.progress(Math.round((processedCount / allStudents.length) * 50));
            }

            // 3. Calculate and Save Positions
            const allResults = await this.termResultRepo.find({
                where: { examGroupId: dto.examGroupId, classId: dto.classId, tenantId, sessionId: sessionId || IsNull() },
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
            await job.progress(75);

            // 4. Calculate and Save Subject-Level Statistics
            const subjectStatsQuery = this.examResultRepo
                .createQueryBuilder('result')
                .leftJoin('result.exam', 'exam')
                .select('exam.id', 'examId')
                .addSelect('MAX(result.score)', 'highest')
                .addSelect('MIN(result.score)', 'lowest')
                .addSelect('AVG(result.score)', 'average')
                .where('exam.examGroupId = :groupId', { groupId: dto.examGroupId })
                .andWhere('exam.classId = :classId', { classId: dto.classId })
                .andWhere('result.tenantId = :tenantId', { tenantId });

            if (sessionId) {
                subjectStatsQuery.andWhere('result.sessionId = :sessionId', { sessionId });
            }

            const subjectStatsRaw = await subjectStatsQuery
                .groupBy('exam.id')
                .getRawMany();

            for (const stat of subjectStatsRaw) {
                await this.examRepo.update(stat.examId, {
                    highestScore: parseFloat(stat.highest),
                    lowestScore: parseFloat(stat.lowest),
                    averageScore: parseFloat(stat.average)
                });
            }

            await job.progress(100);
            this.logger.log(`Completed background result processing for class ${dto.classId}`);
            
            return { success: true, processed: allStudents.length };
        } catch (error: any) {
            this.logger.error(`Error processing results: ${error.message}`, error.stack);
            throw error;
        }
    }
}
