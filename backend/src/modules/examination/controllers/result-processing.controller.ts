import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ResultProcessingService } from '../services/result-processing.service';
import { ProcessResultDto } from '../dtos/processing/processing.dto';

@Controller('examination/processing')
export class ResultProcessingController {
    constructor(private readonly processingService: ResultProcessingService) { }

    @Post('process')
    processResults(@Body() dto: ProcessResultDto) {
        return this.processingService.processResults(dto);
    }

    @Get('broadsheet')
    getBroadsheet(@Query('examGroupId') examGroupId: string, @Query('classId') classId: string) {
        return this.processingService.getBroadsheet(examGroupId, classId);
    }
}
