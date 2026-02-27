import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
// import { JwtAuthGuard } from '@guards/jwt-auth.guard';
// import { RolesGuard } from '@guards/roles.guard';
// import { Roles } from '@decorators/roles.decorator';

@Controller('reporting/dashboard/admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getStats() {
        return this.dashboardService.getAdminStats();
    }

    @Get('charts')
    async getCharts() {
        return this.dashboardService.getAdminCharts();
    }

    @Get('activities')
    async getActivities() {
        return this.dashboardService.getRecentActivities();
    }
}
