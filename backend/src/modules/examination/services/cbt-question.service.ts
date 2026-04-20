import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CbtQuestion } from '../entities/cbt-question.entity';
import { CbtOption } from '../entities/cbt-option.entity';
import { CreateCbtQuestionDto, UpdateCbtQuestionDto } from '../dtos/cbt/question.dto';

@Injectable()
export class CbtQuestionService {
    constructor(
        @InjectRepository(CbtQuestion)
        private questionRepo: Repository<CbtQuestion>,
        @InjectRepository(CbtOption)
        private optionRepo: Repository<CbtOption>,
        private dataSource: DataSource,
    ) { }

    async findAll(examId: string, tenantId: string) {
        return this.questionRepo.find({
            where: { examId, tenantId },
            relations: ['options'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string, tenantId: string) {
        const question = await this.questionRepo.findOne({
            where: { id, tenantId },
            relations: ['options']
        });
        if (!question) throw new NotFoundException('Question not found');
        return question;
    }

    async create(dto: CreateCbtQuestionDto, tenantId: string) {
        const question = this.questionRepo.create({
            content: dto.content,
            marks: dto.marks,
            examId: dto.examId,
            tenantId,
            options: dto.options.map(opt => this.optionRepo.create(opt))
        });
        return this.questionRepo.save(question);
    }

    async update(id: string, dto: UpdateCbtQuestionDto, tenantId: string) {
        const question = await this.findOne(id, tenantId);
        
        return await this.dataSource.transaction(async manager => {
            if (dto.content !== undefined) question.content = dto.content;
            if (dto.marks !== undefined) question.marks = dto.marks;

            if (dto.options) {
                // Simplest approach: Delete existing options and recreation
                // This ensures consistency without complex diffing
                await manager.delete(CbtOption, { questionId: id });
                question.options = dto.options.map(opt => this.optionRepo.create({ ...opt, questionId: id }));
            }

            return await manager.save(question);
        });
    }

    async delete(id: string, tenantId: string) {
        const result = await this.questionRepo.delete({ id, tenantId });
        if (result.affected === 0) throw new NotFoundException('Question not found');
        return { success: true };
    }

    // Bulk Import Logic
    async bulkImport(examId: string, data: any[], tenantId: string) {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as any[]
        };

        await this.dataSource.transaction(async manager => {
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    // Logic to map Excel columns: 
                    // Question text (A), Option A (B), Option B (C), Option C (D), Option D (E), Correct Answer (F), Marks (G)
                    const content = row.Question || row.question || row.Content;
                    const marks = parseInt(row.Marks || row.marks || '1');
                    const correctAnswer = (row['Correct Answer'] || row.correctAnswer || '').toString().trim().toUpperCase(); // e.g., "A"

                    if (!content) throw new Error('Empty question content');

                    const options = [];
                    const optionLabels = ['A', 'B', 'C', 'D', 'E'];
                    
                    for (const label of optionLabels) {
                        const optContent = row[`Option ${label}`] || row[`option${label}`] || row[label];
                        if (optContent) {
                            options.push({
                                content: optContent.toString(),
                                isCorrect: correctAnswer === label
                            });
                        }
                    }

                    if (options.length < 2) throw new Error('At least 2 options are required');
                    if (!options.some(o => o.isCorrect)) throw new Error('Correct answer label must match one of the options provided (A, B, C, D)');

                    const question = manager.create(CbtQuestion, {
                        content,
                        marks,
                        examId,
                        tenantId,
                    });
                    const savedQ = await manager.save(question);
                    
                    const optionsToSave = options.map(opt => manager.create(CbtOption, {
                        ...opt,
                        questionId: savedQ.id
                    }));
                    await manager.save(optionsToSave);

                    results.success++;
                } catch (err: any) {
                    results.failed++;
                    results.errors.push({ row: i + 1, error: err.message });
                }
            }
        });

        return results;
    }
}
