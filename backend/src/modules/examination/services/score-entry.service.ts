import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { ExamResult } from '../entities/exam-result.entity';
import { Exam } from '../entities/exam.entity';
import { AssessmentType } from '../entities/assessment-type.entity';
import { StudentSkill } from '../entities/student-skill.entity';
import { StudentPsychomotor } from '../entities/student-psychomotor.entity';
import { Student } from '../../students/entities/student.entity';
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
        @InjectRepository(Student)
        private studentRepo: Repository<Student>,
        private systemSettingsService: SystemSettingsService,
    ) { }

    // --- Marks Entry ---
    async saveMarks(dto: SaveMarksDto, tenantId: string) {
        // Fetch Exam details for denormalization
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const exam = await this.examRepo.findOne({
            where: { id: dto.examId, tenantId, sessionId: sessionId || IsNull() }
        });

        // 1. Fetch AssessmentType if ID is provided
        let assessmentType = null;
        if (dto.assessmentTypeId) {
            assessmentType = await this.assessmentTypeRepo.findOne({
                where: { id: dto.assessmentTypeId, tenantId }
            });
        }

        // 2. Fetch ALL relevant existing records in one query to avoid N+1
        const studentIds = dto.marks.map(m => m.studentId);
        
        const existingResults = await this.examResultRepo.find({
            where: {
                examId: dto.examId,
                studentId: In(studentIds),
                tenantId,
                assessmentTypeId: dto.assessmentTypeId || IsNull(),
                sessionId: sessionId || IsNull()
            }
        });
        
        const resultMap = new Map(existingResults.map(r => [r.studentId, r]));
        const resultsToSave = [];

        for (const mark of dto.marks) {
            // Strict Validation: Prevent saving scores higher than maxMarks
            if (assessmentType && mark.score > assessmentType.maxMarks) {
                throw new Error(`Invalid score: ${mark.score} exceeds maximum allowed marks (${assessmentType.maxMarks}) for ${assessmentType.name}`);
            }

            let result = resultMap.get(mark.studentId);

            if (!result) {
                result = this.examResultRepo.create({
                    examId: dto.examId,
                    studentId: mark.studentId,
                    assessmentTypeId: dto.assessmentTypeId || undefined,
                    classId: exam?.classId,
                    subjectId: exam?.subjectId,
                    examGroupId: exam?.examGroupId,
                    tenantId,
                    sessionId: sessionId || undefined
                });
            }

            result.score = mark.score;
            result.status = mark.status || 'PRESENT';
            if (assessmentType) {
                result.maxMarks = assessmentType.maxMarks;
            }

            resultsToSave.push(result);
        }

        // 3. Batched Save
        return await this.examResultRepo.save(resultsToSave, { chunk: 100 });
    }

    async getMarks(examId: string, tenantId: string, assessmentTypeId?: string) {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const criteria: any = { examId, tenantId };
        if (sessionId) criteria.sessionId = sessionId;
        if (assessmentTypeId) {
            criteria.assessmentTypeId = assessmentTypeId;
        }

        return this.examResultRepo.find({
            where: criteria,
            relations: ['student', 'assessmentType'],
        });
    }

    async getClassMarks(classId: string, examGroupId: string, tenantId: string) {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = { classId, examGroupId, tenantId };
        if (sessionId) where.sessionId = sessionId;

        return this.examResultRepo.find({
            where,
            relations: ['assessmentType'],
        });
    }

    // --- Skills Entry (Affective) ---
    async saveSkills(dto: SaveSkillsDto, tenantId: string) {
        const studentIds = dto.skills.map(s => s.studentId);
        const existingSkills = await this.studentSkillRepo.find({
            where: {
                studentId: In(studentIds),
                examGroupId: dto.examGroupId,
                tenantId
            }
        });

        // Create a lookup key based on studentId and domainId
        const skillMap = new Map(existingSkills.map(s => [`${s.studentId}_${s.domainId}`, s]));
        const toSave = [];

        for (const entry of dto.skills) {
            const key = `${entry.studentId}_${entry.domainId}`;
            let skill = skillMap.get(key);

            if (!skill) {
                skill = this.studentSkillRepo.create({
                    studentId: entry.studentId,
                    examGroupId: dto.examGroupId,
                    domainId: entry.domainId,
                    tenantId
                });
            }

            skill.rating = entry.rating;
            toSave.push(skill);
        }
        
        return await this.studentSkillRepo.save(toSave, { chunk: 100 });
    }
    async getSkills(examGroupId: string, tenantId: string) {
        return this.studentSkillRepo.find({
            where: { examGroupId, tenantId },
        });
    }

    // --- Psychomotor Entry ---
    async savePsychomotor(dto: SavePsychomotorDto, tenantId: string) {
        const studentIds = dto.ratings.map(r => r.studentId);
        const existingRecords = await this.studentPsychomotorRepo.find({
            where: {
                studentId: In(studentIds),
                examGroupId: dto.examGroupId,
                tenantId
            }
        });

        // Create a lookup key based on studentId and domainId
        const recordMap = new Map(existingRecords.map(r => [`${r.studentId}_${r.domainId}`, r]));
        const toSave = [];

        for (const entry of dto.ratings) {
            const key = `${entry.studentId}_${entry.domainId}`;
            let record = recordMap.get(key);

            if (!record) {
                record = this.studentPsychomotorRepo.create({
                    studentId: entry.studentId,
                    examGroupId: dto.examGroupId,
                    domainId: entry.domainId,
                    tenantId
                });
            }

            record.rating = entry.rating;
            toSave.push(record);
        }
        
        return await this.studentPsychomotorRepo.save(toSave, { chunk: 100 });
    }

    async getPsychomotor(examGroupId: string, tenantId: string) {
        return this.studentPsychomotorRepo.find({
            where: { examGroupId, tenantId },
        });
    }

    // --- Bulk Import Methods ---

    async validateBulkMarks(data: any[], tenantId: string, examId: string, assessmentTypeId?: string) {
        const results = [];
        const existingStudents = await this.studentRepo.find({
            where: { tenantId },
            select: ['id', 'admissionNo', 'firstName', 'lastName']
        });
        const studentMap = new Map(existingStudents.map(s => [s.admissionNo.toLowerCase(), s]));

        let assessmentType = null;
        if (assessmentTypeId) {
            assessmentType = await this.assessmentTypeRepo.findOne({ where: { id: assessmentTypeId, tenantId } });
        }

        for (const row of data) {
            const errors = [];
            const admissionNo = (row['Admission Number'] || row['admissionNo'] || row['AdmissionNo'] || '').toString().toLowerCase();
            const student = studentMap.get(admissionNo);

            if (!student) {
                errors.push(`Student with admission number "${admissionNo}" not found.`);
            }

            // Score check
            let scoreValue = 0;
            // Iterate common keys
            const possibleScoreKeys = ['score', 'marks', 'First CA', 'Second CA', 'Final Exams', 'Exam'];
            for (const key of Object.keys(row)) {
                if (possibleScoreKeys.some(ps => key.toLowerCase() === ps.toLowerCase())) {
                    scoreValue = parseFloat(row[key]);
                    break;
                }
            }

            if (isNaN(scoreValue)) {
                errors.push('Invalid score value.');
            } else if (assessmentType && scoreValue > assessmentType.maxMarks) {
                errors.push(`Score ${scoreValue} exceeds maximum ${assessmentType.maxMarks} for ${assessmentType.name}.`);
            }

            results.push({
                ...row,
                studentId: student?.id,
                studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
                errors,
                validationStatus: errors.length > 0 ? 'Invalid' : 'Valid'
            });
        }
        return results;
    }

    async saveSingleBatchMark(data: {
        admissionNo: string;
        examId: string;
        assessmentTypeId?: string;
        score: number;
        tenantId: string;
    }) {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        
        // 1. Resolve student
        const student = await this.studentRepo.findOne({
            where: { admissionNo: data.admissionNo, tenantId: data.tenantId }
        });
        if (!student) throw new Error(`Student ${data.admissionNo} not found`);

        const exam = await this.examRepo.findOne({
            where: { id: data.examId, tenantId: data.tenantId }
        });

        // 2. Prepare result record
        const criteria: any = {
            examId: data.examId,
            studentId: student.id,
            tenantId: data.tenantId,
            assessmentTypeId: data.assessmentTypeId || IsNull()
        };
        if (sessionId) criteria.sessionId = sessionId;

        let result = await this.examResultRepo.findOne({ where: criteria });

        if (!result) {
            result = this.examResultRepo.create({
                examId: data.examId,
                studentId: student.id,
                assessmentTypeId: data.assessmentTypeId || undefined,
                classId: exam?.classId,
                subjectId: exam?.subjectId,
                examGroupId: exam?.examGroupId,
                tenantId: data.tenantId,
                sessionId: sessionId || undefined
            });
        }

        result.score = data.score;
        result.status = 'PRESENT';
        
        if (data.assessmentTypeId) {
            const at = await this.assessmentTypeRepo.findOne({ where: { id: data.assessmentTypeId } });
            if (at) result.maxMarks = at.maxMarks;
        }

        return this.examResultRepo.save(result);
    }
}

