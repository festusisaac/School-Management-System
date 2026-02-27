import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../dto/attendance.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('hr/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('mark')
    markAttendance(@Body() dto: MarkAttendanceDto) {
        return this.attendanceService.markAttendance(dto);
    }

    @Post('bulk')
    bulkMarkAttendance(@Body() dto: BulkMarkAttendanceDto) {
        return this.attendanceService.bulkMarkAttendance(dto);
    }

    @Get('daily')
    getDailyAttendance(@Query('date') date: string) {
        return this.attendanceService.getAttendanceByDate(date);
    }

    @Get('summary')
    getDailySummary(@Query('date') date: string) {
        return this.attendanceService.getSummary(date);
    }

    @Get('staff/:id')
    getStaffAttendance(
        @Param('id') id: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.attendanceService.getStaffAttendanceRange(
            id,
            new Date(startDate),
            new Date(endDate),
        );
    }
}
