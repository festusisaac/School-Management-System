import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StaffAttendance, AttendanceStatus } from '../entities/staff-attendance.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../dto/attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(StaffAttendance)
        private attendanceRepository: Repository<StaffAttendance>,
        private systemSettingsService: SystemSettingsService,
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
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = { staffId, date: new Date(date) };
        if (sessionId) where.sessionId = sessionId;

        const existing = await this.attendanceRepository.findOne({ where });

        return this.attendanceRepository.save({
            ...(existing || {}),
            ...cleanedDto,
            date: new Date(date),
            sessionId: sessionId || undefined
        } as any);
    }

    async bulkMarkAttendance(dto: BulkMarkAttendanceDto): Promise<StaffAttendance[]> {
        const results: StaffAttendance[] = [];
        for (const item of dto.attendance) {
            results.push(await this.markAttendance(item));
        }
        return results;
    }

    async getAttendanceByDate(date: string, sectionId?: string): Promise<StaffAttendance[]> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        
        const query = this.attendanceRepository.createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.staff', 'staff')
            .leftJoinAndSelect('staff.department', 'department')
            .where('attendance.date = :date', { date: new Date(date) });

        if (sessionId) {
            query.andWhere('attendance.sessionId = :sessionId', { sessionId });
        }

        if (sectionId) {
            query.innerJoin('staff.sections', 'section', 'section.id = :sectionId', { sectionId });
        }

        return query.getMany();
    }

    async getStaffAttendanceRange(staffId: string, startDate: Date, endDate: Date): Promise<StaffAttendance[]> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = {
            staffId,
            date: Between(startDate, endDate)
        };
        if (sessionId) where.sessionId = sessionId;

        return this.attendanceRepository.find({
            where,
            order: { date: 'ASC' }
        });
    }

    async getSummary(date: string, sectionId?: string) {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const targetDate = new Date(date);
        
        const query = this.attendanceRepository.createQueryBuilder('attendance')
            .innerJoin('attendance.staff', 'staff')
            .where('attendance.date = :date', { date: targetDate });

        if (sessionId) {
            query.andWhere('attendance.sessionId = :sessionId', { sessionId });
        }

        if (sectionId) {
            query.innerJoin('staff.sections', 'section', 'section.id = :sectionId', { sectionId });
        }

        const records = await query.getMany();

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
