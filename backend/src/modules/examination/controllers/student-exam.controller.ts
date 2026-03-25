import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { ExamSetupService } from '../services/exam-setup.service';
import { ResultControlService } from '../services/result-control.service';
import { ResultProcessingService } from '../services/result-processing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';
import { AcademicTerm } from '../../system/entities/academic-term.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('examination/student')
export class StudentExamController {
    constructor(
        private readonly setupService: ExamSetupService,
        private readonly controlService: ResultControlService,
        private readonly processingService: ResultProcessingService,
        @InjectRepository(Student)
        private studentRepo: Repository<Student>,
        @InjectRepository(AcademicSession)
        private sessionRepo: Repository<AcademicSession>,
        @InjectRepository(AcademicTerm)
        private termRepo: Repository<AcademicTerm>,
    ) { }

    @Get(':id/dashboard')
    async getDashboard(@Param('id') id: string, @Request() req: any) {
        const tenantId = req.user.tenantId;

        // Resolve student (id could be userId)
        const student = await this.studentRepo.findOne({
            where: [{ id, tenantId }, { userId: id, tenantId }],
            relations: ['class'],
        });

        if (!student) throw new NotFoundException('Student not found');

        // Fetch Exam Groups and Schedules
        const examGroups = await this.setupService.findAllExamGroups(tenantId);
        
        // Find schedules for the most recent/active exam group the student belongs to
        const schedules = await Promise.all(
            examGroups.map(group => this.setupService.getSchedule(group.id, tenantId))
        );

        // Fetch Admit Card Templates
        const admitCards = await Promise.all(
            examGroups.map(group => this.setupService.getAdmitCardTemplates(group.id, tenantId))
        );

        return {
            student,
            examGroups,
            schedules: schedules.flat(),
            admitCards: admitCards.flat(),
        };
    }

    @Post(':id/verify-result')
    async verifyAndGetResult(
        @Param('id') id: string,
        @Body() dto: { code: string; pin: string; examGroupId: string },
        @Request() req: any
    ) {
        const tenantId = req.user.tenantId;

        // 1. Resolve Exam Group to get session/term context
        const examGroup = await this.setupService.findOneExamGroup(dto.examGroupId, tenantId);
        if (!examGroup) throw new NotFoundException('Exam group not found');

        // Resolve AcademicSession to get the UUID that matches examGroup.academicYear
        let academicSessionId = '';
        if (examGroup.academicYear) {
            const session = await this.sessionRepo.findOne({ where: { name: examGroup.academicYear } });
            if (session) {
                academicSessionId = session.id;
            }
        }

        // Resolve AcademicTerm to get the UUID that matches examGroup.term
        let academicTermId = '';
        if (examGroup.term && academicSessionId) {
            // Look up by term name within the resolved session
            const term = await this.termRepo.findOne({ 
                where: { name: examGroup.term, sessionId: academicSessionId } 
            });
            if (term) {
                academicTermId = term.id;
            }
        }

        console.log('[DEBUG verifyAndGetResult] Resolution:', {
            examGroupTerm: examGroup.term,
            examGroupAcademicYear: examGroup.academicYear,
            resolvedSessionId: academicSessionId,
            resolvedTermId: academicTermId,
        });

        // 2. Resolve Student FIRST (id may be userId, not student entity id)
        const student = await this.studentRepo.findOne({
            where: [{ id, tenantId }, { userId: id, tenantId }],
            relations: ['class']
        });
        if (!student) throw new NotFoundException('Student not found');

        await this.controlService.verifyCard({ 
            code: dto.code, 
            pin: dto.pin, 
            studentId: student.id,  // Use resolved student entity ID, not the raw URL param
            sessionId: academicSessionId || undefined as any,
            termId: academicTermId || undefined as any,
        }, tenantId, req.ip, req.headers['user-agent']);

        // 3. Fetch Results (Broadsheet-like for this student)
        const summary = await this.processingService.getBroadsheet(dto.examGroupId, student.classId!, tenantId);
        
        // Filter broadsheet for this specific student
        const studentResult = summary.results.find(r => r.studentId === student.id);
        const subjectScores = summary.subjectScores.filter(s => s.studentId === student.id);

        if (!studentResult) {
            console.log('[DEBUG] No result found for student:', student.id, 'in broadsheet results:', summary.results.map(r => ({ studentId: r.studentId, status: r.status })));
            throw new NotFoundException('Results not found for this term');
        }

        console.log('[DEBUG] Student result status:', studentResult.status, 'for student:', student.id);

        if (studentResult.status !== 'PUBLISHED') {
            throw new BadRequestException('Results for this term are not yet published');
        }

        // 4. Fetch additional raw data needed to build the ReportCardTemplate
        const entityManager = this.studentRepo.manager;

        // Fetch assessment types for this exam group
        const assessments = await entityManager.find('AssessmentType', {
            where: { examGroupId: dto.examGroupId, tenantId, isActive: true }
        }) as any[];
        // Sort manually to avoid TypeORM string-entity typing issues
        assessments.sort((a, b) => a.name.localeCompare(b.name));

        // Fetch raw exam results (individual CA/Exam marks) for this student
        const studentMarks = await entityManager.find('ExamResult', {
            where: { 
                studentId: student.id, 
                tenantId,
                exam: { examGroupId: dto.examGroupId }
            },
            relations: ['exam']
        });

        // Fetch Affective Traits
        const affectiveTraits = await entityManager.find('StudentSkill', {
            where: { studentId: student.id, examGroupId: dto.examGroupId, tenantId },
            relations: ['domain']
        });

        // Fetch Psychomotor Skills
        const psychomotorSkills = await entityManager.find('StudentPsychomotor', {
            where: { studentId: student.id, examGroupId: dto.examGroupId, tenantId },
            relations: ['domain']
        });

        // Exam Group Detail is already fetched at the start of this method as `examGroup`

        return {
            summary: studentResult,
            subjectScores, // enriched scores from broadsheet
            subjectStats: summary.subjectStats, // class stats
            assessments,
            studentMarks,
            affectiveTraits,
            psychomotorSkills,
            examGroup, // for term/session info
            student // for personal details
        };
    }
}
