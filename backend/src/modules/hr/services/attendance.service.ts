import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StaffAttendance, AttendanceStatus } from '../entities/staff-attendance.entity';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../dto/attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(StaffAttendance)
        private attendanceRepository: Repository<StaffAttendance>,
    ) { }

    async markAttendance(dto: MarkAttendanceDto): Promise<StaffAttendance> {
        const { staffId, date } = dto;

        // Clean up empty strings for time fields
        const cleanedDto = {
            ...dto,
            checkInTime: dto.checkInTime === '' ? null : dto.checkInTime,
            checkOutTime: dto.checkOutTime === '' ? null : dto.checkOutTime,
        };

        // Check if record already exists to prevent duplicates
        const existing = await this.attendanceRepository.findOne({
            where: { staffId, date: new Date(date) }
        });

        return this.attendanceRepository.save({
            ...(existing || {}),
            ...cleanedDto,
            date: new Date(date)
        } as any);
    }

    async bulkMarkAttendance(dto: BulkMarkAttendanceDto): Promise<StaffAttendance[]> {
        const results: StaffAttendance[] = [];
        for (const item of dto.attendance) {
            results.push(await this.markAttendance(item));
        }
        return results;
    }

    async getAttendanceByDate(date: string): Promise<StaffAttendance[]> {
        return this.attendanceRepository.find({
            where: { date: new Date(date) },
            relations: ['staff', 'staff.department', 'staff.designation']
        });
    }

    async getStaffAttendanceRange(staffId: string, startDate: Date, endDate: Date): Promise<StaffAttendance[]> {
        return this.attendanceRepository.find({
            where: {
                staffId,
                date: Between(startDate, endDate)
            },
            order: { date: 'ASC' }
        });
    }

    async getSummary(date: string) {
        const targetDate = new Date(date);
        const records = await this.attendanceRepository.find({
            where: { date: targetDate }
        });

        const stats = {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            onLeave: 0,
            total: records.length
        };

        records.forEach(r => {
            switch (r.status) {
                case AttendanceStatus.PRESENT: stats.present++; break;
                case AttendanceStatus.ABSENT: stats.absent++; break;
                case AttendanceStatus.LATE: stats.late++; break;
                case AttendanceStatus.HALF_DAY: stats.halfDay++; break;
                case AttendanceStatus.ON_LEAVE: stats.onLeave++; break;
            }
        });

        return stats;
    }
}
