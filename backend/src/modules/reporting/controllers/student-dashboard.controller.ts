import { Controller, Get, UseGuards, Param, Req, ForbiddenException } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('reporting/dashboard/student')
@UseGuards(JwtAuthGuard)
export class StudentDashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get(':id')
    async getStudentDashboard(@Param('id') id: string, @Req() req: any) {
        const user = req.user;
        const role = (user.role || '').toLowerCase();
        
        // Ensure standard users can only access their own data
        if (role === 'student' && user.id !== id && user.studentId !== id) {
            throw new ForbiddenException('You can only view your own dashboard data.');
        }

        // Use the tenant ID from the token
        const tenantId = user.tenantId;

        // Pass ID directly to service since it might be the userId or the studentId depending on token structure
        // The service logic already has resolution logic or we can trust the ID
        return this.dashboardService.getStudentDashboardStats(id, tenantId, user);
    }
}
