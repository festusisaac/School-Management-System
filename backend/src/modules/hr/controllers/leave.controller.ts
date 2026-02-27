import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeaveService } from '../services/leave.service';
import { StaffService } from '../services/staff.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto, CreateLeaveRequestDto } from '../dto/leave.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('hr/leaves')
@UseGuards(JwtAuthGuard)
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
        const staff = await this.staffService.findByEmail(req.user.email);
        return this.leaveService.createLeaveRequest(staff.id, dto, file);
    }

    @Get('my-requests')
    async getMyRequests(@Request() req: any) {
        const staff = await this.staffService.findByEmail(req.user.email);
        return this.leaveService.getStaffLeaveRequests(staff.id);
    }

    @Get('all-requests')
    getAllRequests() {
        return this.leaveService.getAllLeaveRequests();
    }

    @Get('balance')
    async getBalance(@Request() req: any) {
        const staff = await this.staffService.findByEmail(req.user.email);
        return this.leaveService.getLeaveBalance(staff.id);
    }

    @Post('approve/:id')
    async approve(@Param('id') id: string, @Request() req: any, @Body() body: { status: 'Approved' | 'Rejected', comment?: string }) {
        const staff = await this.staffService.findByEmail(req.user.email);
        return this.leaveService.approveLeave(id, staff.id, body.status, body.comment);
    }
}
