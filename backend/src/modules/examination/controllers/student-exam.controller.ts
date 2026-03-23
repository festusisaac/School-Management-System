import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { ExamSetupService } from '../services/exam-setup.service';
import { ResultControlService } from '../services/result-control.service';
import { ResultProcessingService } from '../services/result-processing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
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
        @Body() dto: { pin: string; examGroupId: string },
        @Request() req: any
    ) {
        const tenantId = req.user.tenantId;

        // 1. Verify Card
        const verification = await this.controlService.verifyCard(dto.pin, tenantId);
        if (!verification.valid) {
            throw new BadRequestException(verification.message || 'Invalid Scratch Card PIN');
        }

        // 2. Resolve Student
        const student = await this.studentRepo.findOne({
            where: [{ id, tenantId }, { userId: id, tenantId }],
        });
        if (!student) throw new NotFoundException('Student not found');

        // 3. Fetch Results (Broadsheet-like for this student)
        const summary = await this.processingService.getBroadsheet(dto.examGroupId, student.classId!, tenantId);
        
        // Filter broadsheet for this specific student
        const studentResult = summary.results.find(r => r.studentId === student.id);
        const subjectScores = summary.subjectScores.filter(s => s.studentId === student.id);

        if (!studentResult) {
            throw new NotFoundException('Results not found for this term');
        }

        if (studentResult.status !== 'PUBLISHED') {
            throw new BadRequestException('Results for this term are not yet published');
        }

        return {
            summary: studentResult,
            subjectScores,
        };
    }
}
