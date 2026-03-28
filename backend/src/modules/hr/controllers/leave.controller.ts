import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeaveService } from '../services/leave.service';
import { StaffService } from '../services/staff.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto, CreateLeaveRequestDto } from '../dto/leave.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';

@Controller('hr/leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveController {
    constructor(
        private readonly leaveService: LeaveService,
        private readonly staffService: StaffService
    ) { }

    // Leave Types
    @Post('types')
    createType(@Body() dto: CreateLeaveTypeDto) {
        return this.leaveService.createLeaveType(dto);
    }

    @Get('types')
    async getTypes() {
        return this.leaveService.getLeaveTypes();
    }

    @Put('types/:id')
    updateType(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
        return this.leaveService.updateLeaveType(id, dto);
    }

    @Delete('types/:id')
    deleteType(@Param('id') id: string) {
        return this.leaveService.deleteLeaveType(id);
    }

    // Leave Requests
    @Post('apply')
    @UseInterceptors(FileInterceptor('document'))
    async applyLeave(
        @Request() req: any,
        @Body() dto: CreateLeaveRequestDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        // Find staff record for current user email
        const staffId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        if (!staffId) {
            throw new BadRequestException('Your account is not linked to a staff profile. Please add yourself to the Staff Directory to apply for leave.');
        }
        return this.leaveService.createLeaveRequest(staffId, dto, file);
    }

    @Get('my-requests')
    async getMyRequests(@Request() req: any) {
        const staffId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        if (!staffId) return [];
        return this.leaveService.getStaffLeaveRequests(staffId);
    }

    @Get('all-requests')
    getAllRequests() {
        return this.leaveService.getAllLeaveRequests();
    }

    @Get('balance')
    async getBalance(@Request() req: any) {
        const staffId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        if (!staffId) return [];
        return this.leaveService.getLeaveBalance(staffId);
    }

    @Post('approve/:id')
    @Permissions('hr:manage_leave')
    async approve(@Param('id') id: string, @Request() req: any, @Body() body: { status: 'Approved' | 'Rejected', comment?: string }) {
        const user = req.user;
        const staffId = await this.staffService.resolveStaffIdByEmail(user.email, user.tenantId);
        
        const userRole = (user.role || '').toLowerCase();
        const isAdmin = userRole === 'super administrator' || userRole === 'admin';

        if (!staffId && !isAdmin) {
            throw new ForbiddenException('Only registered staff members or administrators with appropriate permissions can approve leave.');
        }

        const adminName = isAdmin ? `${user.firstName} ${user.lastName}` : undefined;
        return this.leaveService.approveLeave(id, staffId || null, body.status, body.comment, adminName);
    }
}
