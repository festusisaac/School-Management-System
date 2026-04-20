import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CbtManifestService } from '../services/cbt-manifest.service';

@Controller('examination/cbt/sync')
export class CbtSyncController {
    constructor(
        private readonly manifestService: CbtManifestService,
        @InjectQueue('score-import') private readonly scoreImportQueue: Queue
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('generate-key')
    async generateKey(@Body() body: { examId: string, assessmentTypeId?: string }, @Request() req: any) {
        const syncKey = await this.manifestService.generateSyncKey(body.examId, req.user.tenantId, body.assessmentTypeId);
        return { syncKey };
    }

    @UseGuards(JwtAuthGuard)
    @Post('validate-totals')
    async validateTotals(@Body() body: { examId: string, assessmentTypeId?: string }, @Request() req: any) {
        return this.manifestService.getMarksValidation(body.examId, req.user.tenantId, body.assessmentTypeId);
    }

    // Public endpoint for the Local Node to fetch the manifest
    @Get(':syncKey')
    async getManifest(@Param('syncKey') syncKey: string) {
        return this.manifestService.getManifest(syncKey);
    }

    // Public endpoint for Local Node to upload answers and scores. Authenticable by syncKey.
    @Post('upload-scores/:syncKey')
    @HttpCode(HttpStatus.ACCEPTED)
    async uploadScores(
        @Param('syncKey') syncKey: string,
        @Body() body: { data: any[], assessmentTypeId?: string }
    ) {
        // Fetch manifest and grade the raw CBT answers
        const manifest = await this.manifestService.getManifest(syncKey);
        const gradedData = await this.manifestService.gradeCbtPayload(syncKey, body.data);
        
        const job = await this.scoreImportQueue.add('import-scores', {
            data: gradedData,
            examId: manifest.exam.id,
            assessmentTypeId: body.assessmentTypeId,
            tenantId: manifest.exam.tenantId || 'default', // Ideally extracted from manifest
            userEmail: 'cbt-system@phjcschool.com.ng' // System user
        });
        return { jobId: job.id };
    }
}
