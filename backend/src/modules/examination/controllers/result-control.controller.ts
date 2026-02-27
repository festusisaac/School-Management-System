import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ResultControlService } from '../services/result-control.service';
import { GenerateScratchCardDto } from '../dtos/control/control.dto';

@Controller('examination/control')
export class ResultControlController {
    constructor(private readonly controlService: ResultControlService) { }

    @Post('scratch-cards/generate')
    generateCards(@Body() dto: GenerateScratchCardDto) {
        return this.controlService.generateScratchCards(dto);
    }

    @Get('summary')
    getSummary(@Query('examGroupId') examGroupId: string, @Query('classId') classId: string) {
        return this.controlService.getResultSummary(examGroupId, classId);
    }

    @Post('approve')
    approveResults(@Body() dto: { examGroupId: string; classId: string }) {
        return this.controlService.approveResults(dto.examGroupId, dto.classId);
    }

    @Post('publish')
    publishResults(@Body() dto: { examGroupId: string; classId: string }) {
        return this.controlService.publishResults(dto.examGroupId, dto.classId);
    }
}
