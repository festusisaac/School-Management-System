import { Controller, Post, Body, Get, Query, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { ResultControlService } from '../services/result-control.service';
import { GenerateScratchCardDto, GetScratchCardsFilterDto, VerifyScratchCardDto } from '../dtos/control/control.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('examination/control')
export class ResultControlController {
    constructor(private readonly controlService: ResultControlService) { }

    @Get('scratch-cards/dashboard')
    getDashboard(@Request() req: any) {
        return this.controlService.getDashboardStats(req.user.tenantId);
    }

    @Post('scratch-cards/generate')
    generateCards(@Body() dto: GenerateScratchCardDto, @Request() req: any) {
        return this.controlService.generateScratchCards(dto, req.user.tenantId, req.user.id);
    }

    @Get('scratch-cards')
    getCards(@Query() filter: GetScratchCardsFilterDto, @Request() req: any) {
        return this.controlService.getScratchCards(filter, req.user.tenantId);
    }

    @Get('scratch-cards/batches')
    getBatches(@Request() req: any) {
        return this.controlService.getBatches(req.user.tenantId);
    }

    @Delete('scratch-cards/batches/:id')
    deleteBatch(@Param('id') id: string, @Request() req: any) {
        return this.controlService.deleteBatch(id, req.user.tenantId);
    }

    @Delete('scratch-cards/:id')
    deleteCard(@Param('id') id: string, @Request() req: any) {
        return this.controlService.deleteCard(id, req.user.tenantId);
    }

    @Post('scratch-cards/bulk-delete')
    bulkDelete(@Body('ids') ids: string[], @Request() req: any) {
        return this.controlService.bulkDeleteCards(ids, req.user.tenantId);
    }

    @Post('scratch-cards/:id/sell')
    sellCard(@Param('id') id: string, @Request() req: any) {
        return this.controlService.sellCard(id, req.user.tenantId, req.user.id);
    }

    @Post('scratch-cards/verify')
    verifyCard(@Body() dto: VerifyScratchCardDto, @Request() req: any) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.controlService.verifyCard(dto, req.user.tenantId, ip, userAgent);
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
