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

    async processResults(dto: ProcessResultDto) {
        // 1. Fetch all students in the class (mocked for now, assume we iterate through exam results)
        // In real app: fetch students from StudentsModule

        // 2. Aggregate scores per student
        const aggregation = await this.examResultRepo
            .createQueryBuilder('result')
            .select('result.studentId', 'studentId')
            .addSelect('SUM(result.score)', 'totalScore')
            .addSelect('COUNT(result.id)', 'subjectCount')
            .where('result.examGroupId = :groupId', { groupId: dto.examGroupId })
            .andWhere('result.classId = :classId', { classId: dto.classId })
            .groupBy('result.studentId')
            .getRawMany();

        // 3. Save to StudentTermResult
        for (const record of aggregation) {
            let termResult = await this.termResultRepo.findOne({
                where: {
                    studentId: record.studentId,
                    examGroupId: dto.examGroupId,
                },
            });

            if (!termResult) {
                termResult = this.termResultRepo.create({
                    studentId: record.studentId,
                    examGroupId: dto.examGroupId,
                    classId: dto.classId,
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

    async getBroadsheet(examGroupId: string, classId: string) {
        // Return all term results for a class, ideally with joined Student data
        return this.termResultRepo.find({
            where: { examGroupId, classId },
            relations: ['student'],
            order: { totalScore: 'DESC' }, // Rank by total score
        });
    }
}
