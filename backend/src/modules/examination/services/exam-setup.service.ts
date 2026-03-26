import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamGroup } from '../entities/exam-group.entity';
import { AssessmentType } from '../entities/assessment-type.entity';
import { GradeScale } from '../entities/grade-scale.entity';
import { Exam } from '../entities/exam.entity';
import { ExamSchedule } from '../entities/exam-schedule.entity';
import { AdmitCard } from '../entities/admit-card.entity';
import { PsychomotorDomain } from '../entities/psychomotor-domain.entity';
import { AffectiveDomain } from '../entities/affective-domain.entity';
import { CreateExamGroupDto, CreateAssessmentTypeDto, CreateGradeScaleDto, CreateExamDto, CreateExamScheduleDto } from '../dtos/setup/create-setup.dto';

@Injectable()
export class ExamSetupService {
    constructor(
        @InjectRepository(ExamGroup)
        private examGroupRepo: Repository<ExamGroup>,
        @InjectRepository(AssessmentType)
        private assessmentTypeRepo: Repository<AssessmentType>,
        @InjectRepository(GradeScale)
        private gradeScaleRepo: Repository<GradeScale>,
        @InjectRepository(Exam)
        private examRepo: Repository<Exam>,
        @InjectRepository(ExamSchedule)
        private examScheduleRepo: Repository<ExamSchedule>,
        @InjectRepository(AdmitCard)
        private admitCardRepo: Repository<AdmitCard>,
        @InjectRepository(PsychomotorDomain)
        private psychomotorDomainRepo: Repository<PsychomotorDomain>,
        @InjectRepository(AffectiveDomain)
        private affectiveDomainRepo: Repository<AffectiveDomain>,
    ) { }


    // --- Exam Groups ---
    async createExamGroup(dto: CreateExamGroupDto, tenantId: string) {
        const group = this.examGroupRepo.create({ ...dto, tenantId });
        return this.examGroupRepo.save(group);
    }

    async findAllExamGroups(tenantId: string) {
        return this.examGroupRepo.find({ 
            where: { tenantId },
            order: { startDate: 'DESC' } 
        });
    }

    async findOneExamGroup(id: string, tenantId: string) {
        return this.examGroupRepo.findOne({ where: { id, tenantId } });
    }

    async updateExamGroup(id: string, dto: Partial<CreateExamGroupDto>, tenantId: string) {
        await this.examGroupRepo.update({ id, tenantId }, dto);
        return this.examGroupRepo.findOne({ where: { id, tenantId } });
    }

    async deleteExamGroup(id: string, tenantId: string) {
        return this.examGroupRepo.delete({ id, tenantId });
    }

    // --- Assessment Types ---
    async createAssessmentType(dto: CreateAssessmentTypeDto, tenantId: string) {
        const type = this.assessmentTypeRepo.create({ ...dto, tenantId });
        return this.assessmentTypeRepo.save(type);
    }

    async getAssessmentTypes(examGroupId: string, tenantId: string) {
        return this.assessmentTypeRepo.find({ where: { examGroupId, tenantId } });
    }

    async updateAssessmentType(id: string, dto: Partial<CreateAssessmentTypeDto>, tenantId: string) {
        await this.assessmentTypeRepo.update({ id, tenantId }, dto);
        return this.assessmentTypeRepo.findOne({ where: { id, tenantId } });
    }

    async deleteAssessmentType(id: string, tenantId: string) {
        return this.assessmentTypeRepo.delete({ id, tenantId });
    }

    // --- Grade Scales ---
    async createGradeScale(dto: CreateGradeScaleDto, tenantId: string) {
        const scale = this.gradeScaleRepo.create({ ...dto, tenantId });
        return this.gradeScaleRepo.save(scale);
    }

    async getGradeScales(tenantId: string) {
        return this.gradeScaleRepo.find({ where: { tenantId } });
    }

    async updateGradeScale(id: string, dto: Partial<CreateGradeScaleDto>, tenantId: string) {
        await this.gradeScaleRepo.update({ id, tenantId }, dto);
        return this.gradeScaleRepo.findOne({ where: { id, tenantId } });
    }

    async deleteGradeScale(id: string, tenantId: string) {
        return this.gradeScaleRepo.delete({ id, tenantId });
    }

    // --- Exams ---
    async createExam(dto: CreateExamDto, tenantId: string) {
        const exam = this.examRepo.create({ ...dto, tenantId });
        return this.examRepo.save(exam);
    }

    async getExams(examGroupId: string, tenantId: string) {
        return this.examRepo.find({
            where: { examGroupId, tenantId },
            relations: ['subject', 'class', 'examGroup'],
        });
    }

    async updateExam(id: string, dto: Partial<CreateExamDto>, tenantId: string) {
        await this.examRepo.update({ id, tenantId }, dto);
        return this.examRepo.findOne({ where: { id, tenantId } });
    }

    async deleteExam(id: string, tenantId: string) {
        return this.examRepo.delete({ id, tenantId });
    }

    // --- Schedules ---
    async scheduleExam(dto: CreateExamScheduleDto, tenantId: string) {
        const schedule = this.examScheduleRepo.create({ ...dto, tenantId });
        return this.examScheduleRepo.save(schedule);
    }

    async getSchedule(examGroupId: string, tenantId: string) {
        return this.examScheduleRepo.find({
            where: { exam: { examGroupId }, tenantId },
            relations: ['exam', 'exam.subject', 'exam.class'],
            order: { date: 'ASC', startTime: 'ASC' },
        });
    }

    async getScheduleForClass(classId: string, tenantId: string) {
        return this.examScheduleRepo.find({
            where: { exam: { classId }, tenantId },
            relations: ['exam', 'exam.subject', 'exam.class'],
            order: { date: 'ASC', startTime: 'ASC' },
        });
    }

    async getExamsForClass(classId: string, tenantId: string) {
        return this.examRepo.find({
            where: { classId, tenantId },
            relations: ['subject', 'class', 'examGroup'],
        });
    }

    async updateSchedule(id: string, dto: Partial<CreateExamScheduleDto>, tenantId: string) {
        await this.examScheduleRepo.update({ id, tenantId }, dto);
        return this.examScheduleRepo.findOne({ where: { id, tenantId }, relations: ['exam', 'exam.subject', 'exam.class'] });
    }

    async deleteSchedule(id: string, tenantId: string) {
        return this.examScheduleRepo.delete({ id, tenantId });
    }

    // --- Admit Cards ---
    async createAdmitCardTemplate(dto: any, tenantId: string) {
        const template = this.admitCardRepo.create({ ...dto, tenantId });
        return this.admitCardRepo.save(template);
    }

    async getAdmitCardTemplates(examGroupId: string, tenantId: string) {
        return this.admitCardRepo.find({ where: { examGroupId, tenantId } });
    }

    async updateAdmitCardTemplate(id: string, dto: any, tenantId: string) {
        await this.admitCardRepo.update({ id, tenantId }, dto);
        return this.admitCardRepo.findOne({ where: { id, tenantId } });
    }

    async deleteAdmitCardTemplate(id: string, tenantId: string) {
        return this.admitCardRepo.delete({ id, tenantId });
    }

    async getAdmitCardBatchData(examGroupId: string, tenantId: string, classId?: string) {
        // Fetch group, schedules, and students in parallel for efficiency
        const [schedules, group] = await Promise.all([
            this.getSchedule(examGroupId, tenantId),
            this.findOneExamGroup(examGroupId, tenantId),
        ]);

        return {
            schedules,
            group,
        };
    }

    // --- Domains ---
    async createPsychomotorDomain(name: string, tenantId: string) {
        const domain = this.psychomotorDomainRepo.create({ name, tenantId });
        return this.psychomotorDomainRepo.save(domain);
    }

    async getPsychomotorDomains(tenantId: string) {
        return this.psychomotorDomainRepo.find({ where: { tenantId } });
    }

    async updatePsychomotorDomain(id: string, name: string, tenantId: string) {
        await this.psychomotorDomainRepo.update({ id, tenantId }, { name });
        return this.psychomotorDomainRepo.findOne({ where: { id, tenantId } });
    }

    async deletePsychomotorDomain(id: string, tenantId: string) {
        return this.psychomotorDomainRepo.delete({ id, tenantId });
    }

    // --- Affective Domains ---
    async createAffectiveDomain(name: string, tenantId: string) {
        const domain = this.affectiveDomainRepo.create({ name, tenantId });
        return this.affectiveDomainRepo.save(domain);
    }

    async getAffectiveDomains(tenantId: string) {
        return this.affectiveDomainRepo.find({ where: { tenantId } });
    }

    async updateAffectiveDomain(id: string, name: string, tenantId: string) {
        await this.affectiveDomainRepo.update({ id, tenantId }, { name });
        return this.affectiveDomainRepo.findOne({ where: { id, tenantId } });
    }

    async deleteAffectiveDomain(id: string, tenantId: string) {
        return this.affectiveDomainRepo.delete({ id, tenantId });
    }
}
