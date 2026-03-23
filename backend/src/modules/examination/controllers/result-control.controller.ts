import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ResultControlService } from '../services/result-control.service';
import { GenerateScratchCardDto } from '../dtos/control/control.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('examination/control')
export class ResultControlController {
    constructor(private readonly controlService: ResultControlService) { }

    @Post('scratch-cards/generate')
    generateCards(@Body() dto: GenerateScratchCardDto, @Request() req: any) {
        return this.controlService.generateScratchCards(dto, req.user.tenantId);
    }

    @Get('summary')
    getSummary(@Query('examGroupId') examGroupId: string, @Query('classId') classId: string, @Request() req: any) {
        return this.controlService.getResultSummary(examGroupId, classId, req.user.tenantId);
    }

    @Post('approve')
    approveResults(@Body() dto: { examGroupId: string; classId: string }, @Request() req: any) {
        return this.controlService.approveResults(dto.examGroupId, dto.classId, req.user.tenantId);
    }

    @Post('publish')
    publishResults(@Body() dto: { examGroupId: string; classId: string }, @Request() req: any) {
        return this.controlService.publishResults(dto.examGroupId, dto.classId, req.user.tenantId);
    }
}
