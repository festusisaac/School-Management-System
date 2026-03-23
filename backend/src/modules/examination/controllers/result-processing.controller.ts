import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ResultProcessingService } from '../services/result-processing.service';
import { ProcessResultDto } from '../dtos/processing/processing.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('examination/processing')
export class ResultProcessingController {
    constructor(private readonly processingService: ResultProcessingService) { }

    @Post('process')
    processResults(@Body() dto: ProcessResultDto, @Request() req: any) {
        return this.processingService.processResults(dto, req.user.tenantId);
    }

    @Get('broadsheet')
    getBroadsheet(@Query('examGroupId') examGroupId: string, @Query('classId') classId: string, @Request() req: any) {
        return this.processingService.getBroadsheet(examGroupId, classId, req.user.tenantId);
    }
}
