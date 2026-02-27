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
    async createExamGroup(dto: CreateExamGroupDto) {
        const group = this.examGroupRepo.create(dto);
        return this.examGroupRepo.save(group);
    }

    async findAllExamGroups() {
        return this.examGroupRepo.find({ order: { startDate: 'DESC' } });
    }

    async findOneExamGroup(id: string) {
        return this.examGroupRepo.findOne({ where: { id } });
    }

    async updateExamGroup(id: string, dto: Partial<CreateExamGroupDto>) {
        await this.examGroupRepo.update(id, dto);
        return this.examGroupRepo.findOne({ where: { id } });
    }

    async deleteExamGroup(id: string) {
        return this.examGroupRepo.delete(id);
    }

    // --- Assessment Types ---
    async createAssessmentType(dto: CreateAssessmentTypeDto) {
        const type = this.assessmentTypeRepo.create(dto);
        return this.assessmentTypeRepo.save(type);
    }

    async getAssessmentTypes(examGroupId: string) {
        return this.assessmentTypeRepo.find({ where: { examGroupId } });
    }

    async updateAssessmentType(id: string, dto: Partial<CreateAssessmentTypeDto>) {
        await this.assessmentTypeRepo.update(id, dto);
        return this.assessmentTypeRepo.findOne({ where: { id } });
    }

    async deleteAssessmentType(id: string) {
        return this.assessmentTypeRepo.delete(id);
    }

    // --- Grade Scales ---
    async createGradeScale(dto: CreateGradeScaleDto) {
        const scale = this.gradeScaleRepo.create(dto);
        return this.gradeScaleRepo.save(scale);
    }

    async getGradeScales() {
        return this.gradeScaleRepo.find();
    }

    async updateGradeScale(id: string, dto: Partial<CreateGradeScaleDto>) {
        await this.gradeScaleRepo.update(id, dto);
        return this.gradeScaleRepo.findOne({ where: { id } });
    }

    async deleteGradeScale(id: string) {
        return this.gradeScaleRepo.delete(id);
    }

    // --- Exams ---
    async createExam(dto: CreateExamDto) {
        const exam = this.examRepo.create(dto);
        return this.examRepo.save(exam);
    }

    async getExams(examGroupId: string) {
        return this.examRepo.find({
            where: { examGroupId },
            relations: ['subject', 'class', 'examGroup'],
        });
    }

    async deleteExam(id: string) {
        return this.examRepo.delete(id);
    }

    // --- Schedules ---
    async scheduleExam(dto: CreateExamScheduleDto) {
        const schedule = this.examScheduleRepo.create(dto);
        return this.examScheduleRepo.save(schedule);
    }

    async getSchedule(examGroupId: string) {
        return this.examScheduleRepo.find({
            where: { exam: { examGroupId } },
            relations: ['exam', 'exam.subject', 'exam.class'],
            order: { date: 'ASC', startTime: 'ASC' },
        });
    }

    async updateSchedule(id: string, dto: Partial<CreateExamScheduleDto>) {
        await this.examScheduleRepo.update(id, dto);
        return this.examScheduleRepo.findOne({ where: { id }, relations: ['exam', 'exam.subject', 'exam.class'] });
    }

    async deleteSchedule(id: string) {
        return this.examScheduleRepo.delete(id);
    }

    // --- Admit Cards ---
    async createAdmitCardTemplate(dto: any) {
        const template = this.admitCardRepo.create(dto);
        return this.admitCardRepo.save(template);
    }

    async getAdmitCardTemplates(examGroupId: string) {
        return this.admitCardRepo.find({ where: { examGroupId } });
    }

    async updateAdmitCardTemplate(id: string, dto: any) {
        await this.admitCardRepo.update(id, dto);
        return this.admitCardRepo.findOne({ where: { id } });
    }

    async deleteAdmitCardTemplate(id: string) {
        return this.admitCardRepo.delete(id);
    }

    async getAdmitCardBatchData(examGroupId: string, classId?: string) {
        // Fetch group, schedules, and students in parallel for efficiency
        const [schedules, group] = await Promise.all([
            this.getSchedule(examGroupId),
            this.findOneExamGroup(examGroupId),
        ]);

        return {
            schedules,
            group,
        };
    }

    // --- Domains ---
    async createPsychomotorDomain(name: string) {
        const domain = this.psychomotorDomainRepo.create({ name });
        return this.psychomotorDomainRepo.save(domain);
    }

    async getPsychomotorDomains() {
        return this.psychomotorDomainRepo.find();
    }

    async updatePsychomotorDomain(id: string, name: string) {
        await this.psychomotorDomainRepo.update(id, { name });
        return this.psychomotorDomainRepo.findOne({ where: { id } });
    }

    async deletePsychomotorDomain(id: string) {
        return this.psychomotorDomainRepo.delete(id);
    }

    // --- Affective Domains ---
    async createAffectiveDomain(name: string) {
        const domain = this.affectiveDomainRepo.create({ name });
        return this.affectiveDomainRepo.save(domain);
    }

    async getAffectiveDomains() {
        return this.affectiveDomainRepo.find();
    }

    async updateAffectiveDomain(id: string, name: string) {
        await this.affectiveDomainRepo.update(id, { name });
        return this.affectiveDomainRepo.findOne({ where: { id } });
    }

    async deleteAffectiveDomain(id: string) {
        return this.affectiveDomainRepo.delete(id);
    }
}
