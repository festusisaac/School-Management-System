import { Controller, Get, UseGuards, Param, Query, Req, ForbiddenException } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('reporting/dashboard/student')
@UseGuards(JwtAuthGuard)
export class StudentDashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get(':id')
    async getStudentDashboard(
        @Param('id') id: string,
        @Query('sessionId') sessionId: string,
        @Query('termId') termId: string,
        @Req() req: any
    ) {
        const user = req.user;
        const role = (user.role || '').toLowerCase();
        
        // Ensure standard users can only access their own data
        if (role === 'student' && user.id !== id && user.studentId !== id) {
            throw new ForbiddenException('You can only view your own dashboard data.');
        }

        // Use the tenant ID from the token
        const tenantId = user.tenantId;

        return this.dashboardService.getStudentDashboardStats(id, tenantId, user, sessionId, termId);
    }

    @Get('parent/overview')
    async getParentOverview(
        @Query('sessionId') sessionId: string,
        @Req() req: any
    ) {
        const user = req.user;
        const role = (user.role || '').toLowerCase();

        if (role !== 'parent') {
            throw new ForbiddenException('Only parents can access the family overview.');
        }

        return this.dashboardService.getParentDashboardOverview(user.id, user.tenantId, sessionId);
    }
}
