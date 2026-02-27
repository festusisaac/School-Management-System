import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentSkill } from '../entities/student-skill.entity';
import { StudentPsychomotor } from '../entities/student-psychomotor.entity';
import { SaveMarksDto, SaveSkillsDto, SavePsychomotorDto } from '../dtos/entry/score-entry.dto';

@Injectable()
export class ScoreEntryService {
    constructor(
        @InjectRepository(ExamResult)
        private examResultRepo: Repository<ExamResult>,
        @InjectRepository(StudentSkill)
        private studentSkillRepo: Repository<StudentSkill>,
        @InjectRepository(StudentPsychomotor)
        private studentPsychomotorRepo: Repository<StudentPsychomotor>,
    ) { }

    // --- Marks Entry ---
    async saveMarks(dto: SaveMarksDto) {
        const savedResults = [];
        for (const mark of dto.marks) {
            // Build query criteria
            const criteria: any = {
                examId: dto.examId,
                studentId: mark.studentId
            };

            // If assessmentTypeId is provided (for granular scores), add it to criteria
            if (dto.assessmentTypeId) {
                criteria.assessmentTypeId = dto.assessmentTypeId;
            } else {
                // If not provided (legacy or total), ensure we check for null
                criteria.assessmentTypeId = null;
            }

            let result = await this.examResultRepo.findOne({
                where: criteria,
            });

            if (!result) {
                result = this.examResultRepo.create({
                    examId: dto.examId,
                    studentId: mark.studentId,
                    assessmentTypeId: dto.assessmentTypeId || undefined
                });
            }

            result.score = mark.score;
            result.status = mark.status || 'PRESENT';
            // In a real app, fetch maxMarks from Exam/AssessmentType here
            savedResults.push(await this.examResultRepo.save(result));
        }
        return savedResults;
    }

    async getMarks(examId: string, assessmentTypeId?: string) {
        const criteria: any = { examId };
        if (assessmentTypeId) {
            criteria.assessmentTypeId = assessmentTypeId;
        }

        return this.examResultRepo.find({
            where: criteria,
            relations: ['student', 'assessmentType'],
        });
    }

    // --- Skills Entry (Affective) ---
    async saveSkills(dto: SaveSkillsDto) {
        const savedSkills = [];
        for (const entry of dto.skills) {
            let skill = await this.studentSkillRepo.findOne({
                where: {
                    studentId: entry.studentId,
                    examGroupId: dto.examGroupId,
                    domainId: entry.domainId
                },
            });

            if (!skill) {
                skill = this.studentSkillRepo.create({
                    studentId: entry.studentId,
                    examGroupId: dto.examGroupId,
                    domainId: entry.domainId,
                });
            }

            skill.rating = entry.rating;
            savedSkills.push(await this.studentSkillRepo.save(skill));
        }
        return savedSkills;
    }
    async getSkills(examGroupId: string) {
        return this.studentSkillRepo.find({
            where: { examGroupId },
        });
    }

    // --- Psychomotor Entry ---
    async savePsychomotor(dto: SavePsychomotorDto) {
        const saved = [];
        for (const entry of dto.ratings) {
            let record = await this.studentPsychomotorRepo.findOne({
                where: {
                    studentId: entry.studentId,
                    examGroupId: dto.examGroupId,
                    domainId: entry.domainId
                },
            });

            if (!record) {
                record = this.studentPsychomotorRepo.create({
                    studentId: entry.studentId,
                    examGroupId: dto.examGroupId,
                    domainId: entry.domainId,
                });
            }

            record.rating = entry.rating;
            saved.push(await this.studentPsychomotorRepo.save(record));
        }
        return saved;
    }

    async getPsychomotor(examGroupId: string) {
        return this.studentPsychomotorRepo.find({
            where: { examGroupId },
        });
    }
}

