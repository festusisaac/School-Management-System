import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from '../entities/exam-result.entity';
import { Exam } from '../entities/exam.entity';
import { AssessmentType } from '../entities/assessment-type.entity';
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
        @InjectRepository(AssessmentType)
        private assessmentTypeRepo: Repository<AssessmentType>,
        @InjectRepository(Exam)
        private examRepo: Repository<Exam>,
    ) { }

    // --- Marks Entry ---
    async saveMarks(dto: SaveMarksDto) {
        const savedResults = [];

        // Fetch Exam details for denormalization
        const exam = await this.examRepo.findOne({
            where: { id: dto.examId }
        });

        // Fetch AssessmentType once if ID is provided
        let assessmentType: any = null;
        if (dto.assessmentTypeId) {
            assessmentType = await this.assessmentTypeRepo.findOne({
                where: { id: dto.assessmentTypeId }
            });
        }

        for (const mark of dto.marks) {
            // Strict Validation: Prevent saving scores higher than maxMarks
            if (assessmentType && mark.score > assessmentType.maxMarks) {
                throw new Error(`Invalid score: ${mark.score} exceeds maximum allowed marks (${assessmentType.maxMarks}) for ${assessmentType.name}`);
            }

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
                    assessmentTypeId: dto.assessmentTypeId || undefined,
                    // Denormalize fields from exam
                    classId: exam?.classId,
                    subjectId: exam?.subjectId,
                    examGroupId: exam?.examGroupId,
                    tenantId: exam?.tenantId
                });
            }

            result.score = mark.score;
            result.status = mark.status || 'PRESENT';

            // Populate maxMarks from AssessmentType
            if (assessmentType) {
                result.maxMarks = assessmentType.maxMarks;
            }

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

    async getClassMarks(classId: string, examGroupId: string) {
        return this.examResultRepo.find({
            where: { classId, examGroupId },
            relations: ['assessmentType'],
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

