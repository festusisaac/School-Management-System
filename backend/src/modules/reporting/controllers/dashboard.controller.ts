import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard, RolesGuard } from '../../../guards/jwt-auth.guard';
import { Roles } from '../../../decorators/roles.decorator';

@Controller('reporting/dashboard/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super admin', 'admin')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getStats(
        @Query('sectionId') sectionId: string,
        @Query('sessionId') sessionId: string,
        @Query('termId') termId: string,
        @Req() req: any
    ) {
        return this.dashboardService.getAdminStats(req.user.tenantId, sectionId, sessionId, termId);
    }

    @Get('charts')
    async getCharts(
        @Query('sectionId') sectionId: string,
        @Query('sessionId') sessionId: string,
        @Query('termId') termId: string,
        @Req() req: any
    ) {
        return this.dashboardService.getAdminCharts(req.user.tenantId, sectionId, sessionId, termId);
    }

    @Get('activities')
    async getActivities(
        @Query('sectionId') sectionId: string,
        @Query('sessionId') sessionId: string,
        @Query('termId') termId: string,
        @Req() req: any
    ) {
        return this.dashboardService.getRecentActivities(req.user.tenantId, sectionId, sessionId, termId);
    }
}
