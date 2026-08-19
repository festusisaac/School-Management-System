import { Controller, Get, Post, Put, Delete, Body, Param, Res, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { join, basename } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { LeaveService } from '../services/leave.service';
import { StaffService } from '../services/staff.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto, CreateLeaveRequestDto } from '../dto/leave.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';
import { PushNotificationService } from '../../notifications/services/push-notification.service';

@Controller('hr/leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveController {
    constructor(
        private readonly leaveService: LeaveService,
        private readonly staffService: StaffService,
        private readonly pushService: PushNotificationService,
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

    /**
     * Download a leave request's supporting document. Access: the staff member
     * who filed it, or a user with the hr:manage_leave permission. Files are
     * private (never public), so this is the only way to reach them.
     */
    @Get('requests/:id/attachment')
    async downloadAttachment(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
        const request = await this.leaveService.getLeaveRequestById(id);
        if (!request || !request.supportingDocument) throw new NotFoundException('No supporting document');

        const perms: string[] = req.user.permissions || [];
        const role = (req.user.role || '').toLowerCase();
        const isManager = perms.includes('hr:manage_leave') || role === 'admin' || role === 'super administrator';
        if (!isManager) {
            const staffId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
            if (!staffId || staffId !== request.staffId) {
                throw new ForbiddenException('You can only access your own leave document.');
            }
        }

        const rel = request.supportingDocument.replace(/^\/+/, '');
        const abs = join(process.cwd(), rel);
        const allowedRoots = [join(process.cwd(), 'private-uploads'), join(process.cwd(), 'uploads')];
        if (!allowedRoots.some((r) => abs.startsWith(r)) || !fs.existsSync(abs)) throw new NotFoundException('File not found');

        const base = basename(abs);
        const sep = base.indexOf('__');
        let name = base;
        if (sep !== -1) { try { name = decodeURIComponent(base.slice(sep + 2)) || base; } catch { name = base; } }
        return res.download(abs, name);
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
        const request = await this.leaveService.approveLeave(id, staffId || null, body.status, body.comment, adminName);

        this.notifyRequester(request, user.tenantId).catch((err) =>
            console.error('Failed to push-notify leave decision:', err),
        );

        return request;
    }

    private async notifyRequester(request: { staffId: string; status: string }, tenantId: string): Promise<void> {
        const staff = await this.staffService.findOne(request.staffId, tenantId).catch(() => null);
        if (!staff?.email) return;
        const userId = await this.pushService.getStaffUserIdByEmail(staff.email, tenantId);
        if (!userId) return;

        const approved = request.status === 'Approved';
        await this.pushService.sendToUserIds([userId], {
            title: approved ? 'Leave Approved' : 'Leave Rejected',
            body: approved ? 'Your leave request has been approved.' : 'Your leave request has been rejected.',
            data: { type: 'leave', leaveRequestId: (request as any).id },
        });
    }
}
