import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ScoreEntryService } from '../services/score-entry.service';
import { SaveMarksDto, SaveSkillsDto, SavePsychomotorDto } from '../dtos/entry/score-entry.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('examination/entry')
export class ScoreEntryController {
    constructor(
        private readonly entryService: ScoreEntryService,
        @InjectQueue('score-import') private readonly scoreImportQueue: Queue
    ) { }

    @Post('marks')
    saveMarks(@Body() dto: SaveMarksDto, @Request() req: any) {
        return this.entryService.saveMarks(dto, req.user.tenantId);
    }

    @Get('marks/:examId')
    getMarks(@Param('examId') examId: string, @Request() req: any, @Query('assessmentTypeId') assessmentTypeId?: string) {
        return this.entryService.getMarks(examId, req.user.tenantId, assessmentTypeId);
    }

    @Get('class-marks/:classId/:examGroupId')
    getClassMarks(@Param('classId') classId: string, @Param('examGroupId') examGroupId: string, @Request() req: any) {
        return this.entryService.getClassMarks(classId, examGroupId, req.user.tenantId);
    }

    @Post('skills')
    saveSkills(@Body() dto: SaveSkillsDto, @Request() req: any) {
        return this.entryService.saveSkills(dto, req.user.tenantId);
    }

    @Get('skills/:examGroupId')
    getSkills(@Param('examGroupId') examGroupId: string, @Request() req: any) {
        return this.entryService.getSkills(examGroupId, req.user.tenantId);
    }

    @Post('psychomotor')
    savePsychomotor(@Body() dto: SavePsychomotorDto, @Request() req: any) {
        return this.entryService.savePsychomotor(dto, req.user.tenantId);
    }

    @Get('psychomotor/:examGroupId')
    getPsychomotor(@Param('examGroupId') examGroupId: string, @Request() req: any) {
        return this.entryService.getPsychomotor(examGroupId, req.user.tenantId);
    }

    // --- Bulk Import Endpoints ---

    @Post('bulk/validate')
    async validateBulk(@Body() body: { data: any[], examId: string, assessmentTypeId?: string }, @Request() req: any) {
        return this.entryService.validateBulkMarks(body.data, req.user.tenantId, body.examId, body.assessmentTypeId);
    }

    @Post('bulk/import')
    @HttpCode(HttpStatus.ACCEPTED)
    async importBulk(@Body() body: { data: any[], examId: string, assessmentTypeId?: string }, @Request() req: any) {
        const job = await this.scoreImportQueue.add('import-scores', {
            data: body.data,
            examId: body.examId,
            assessmentTypeId: body.assessmentTypeId,
            tenantId: req.user.tenantId,
            userEmail: req.user.email
        });
        return { jobId: job.id };
    }

    @Get('bulk/import/status/:jobId')
    async getImportStatus(@Param('jobId') jobId: string) {
        const job = await this.scoreImportQueue.getJob(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        const state = await job.getState();
        const progress = job.progress();
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        return {
            id: job.id,
            state,
            progress,
            result,
            failedReason
        };
    }
}

