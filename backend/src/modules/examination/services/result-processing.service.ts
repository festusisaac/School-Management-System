import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { ProcessResultDto } from '../dtos/processing/processing.dto';

@Injectable()
export class ResultProcessingService {
    constructor(
        @InjectRepository(ExamResult)
        private examResultRepo: Repository<ExamResult>,
        @InjectRepository(StudentTermResult)
        private termResultRepo: Repository<StudentTermResult>,
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

            await this.termResultRepo.save(termResult);
        }

        return { message: 'Processing complete', studentsProcessed: aggregation.length };
    }

    async getBroadsheet(examGroupId: string, classId: string, tenantId: string) {
        // 1. Fetch official processed term results
        const results = await this.termResultRepo.find({
            where: { examGroupId, classId, tenantId },
            relations: ['student'],
            order: { totalScore: 'DESC' },
        });

        // 2. Fetch subject-level aggregations
        const subjectScores = await this.examResultRepo
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

        return {
            results,
            subjectScores
        };
    }
}
