import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TranscriptService } from '../services/transcript.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('examination/transcripts')
@UseGuards(JwtAuthGuard)
export class TranscriptController {
    constructor(private readonly transcriptService: TranscriptService) {}

    @Get(':studentId')
    async getStudentTranscript(
        @Param('studentId') studentId: string,
        @Req() req: Request
    ) {
        const tenantId = (req as any).user.tenantId;
        return this.transcriptService.getStudentTranscript(studentId, tenantId);
    }
}
