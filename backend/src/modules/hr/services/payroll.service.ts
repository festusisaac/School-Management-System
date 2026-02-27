import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll, PayrollStatus } from '../entities/payroll.entity';
import { Staff } from '../entities/staff.entity';
import { StaffAttendance, AttendanceStatus } from '../entities/staff-attendance.entity';
import { LeaveRequest, LeaveStatus } from '../entities/leave-request.entity';
import { CreatePayrollDto, UpdatePayrollStatusDto, BulkCreatePayrollDto } from '../dto/payroll.dto';
import { Between } from 'typeorm';
import moment from 'moment';

@Injectable()
export class PayrollService {
    constructor(
        @InjectRepository(Payroll)
        private readonly payrollRepository: Repository<Payroll>,
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
        @InjectRepository(StaffAttendance)
        private readonly attendanceRepository: Repository<StaffAttendance>,
        @InjectRepository(LeaveRequest)
        private readonly leaveRequestRepository: Repository<LeaveRequest>,
    ) { }

    async create(createPayrollDto: CreatePayrollDto): Promise<Payroll> {
        const { staffId, month, year, allowances = [], deductions = [] } = createPayrollDto;

        // Check if payroll already exists for this staff/month/year
        const existing = await this.payrollRepository.findOne({
            where: { staffId, month, year }
        });

        if (existing) {
            throw new BadRequestException(`Payroll already generated for this staff member for ${month}/${year}`);
        }

        const staff = await this.staffRepository.findOne({ where: { id: staffId } });
        if (!staff) {
            throw new NotFoundException(`Staff member with ID ${staffId} not found`);
        }

        const basicSalary = createPayrollDto.basicSalary || Number(staff.basicSalary);

        // Use staff's default allowances/deductions if none provided
        const finalAllowances = allowances.length > 0 ? allowances : (staff.allowances || []);
        const finalDeductions = deductions.length > 0 ? deductions : (staff.deductions || []);

        const totalAllowances = finalAllowances.reduce((sum, item) => sum + Number(item.amount), 0);

        // Auto-calculate attendance if not provided
        let { workingDays, presentDays, leaveDays, absentDays } = createPayrollDto;

        const summary = await this.getAttendanceSummary(staffId, month, year);

        if (workingDays === undefined || presentDays === undefined) {
            workingDays = workingDays ?? 22; // Default to 22 if still undefined
            presentDays = presentDays ?? summary.presentDays;
            leaveDays = leaveDays ?? summary.leaveDays;
            absentDays = absentDays ?? summary.absentDays;
        }

        // Add Loss of Pay (LOP) for unpaid leaves to finalDeductions
        if (summary.unpaidLeaveDays > 0) {
            const lopAmount = Math.round((Number(basicSalary) / 30) * summary.unpaidLeaveDays);
            finalDeductions.push({
                name: `Loss of Pay (${summary.unpaidLeaveDays} days)`,
                amount: lopAmount
            });
        }

        const totalDeductions = finalDeductions.reduce((sum, item) => sum + Number(item.amount), 0);
        const grossSalary = Number(basicSalary) + totalAllowances;
        const netSalary = grossSalary - totalDeductions;

        const payroll = this.payrollRepository.create({
            ...createPayrollDto,
            basicSalary,
            allowances: finalAllowances,
            deductions: finalDeductions,
            grossSalary,
            netSalary,
            status: PayrollStatus.PENDING,
            workingDays,
            presentDays,
            leaveDays: leaveDays || 0,
            absentDays: absentDays ?? (workingDays - presentDays - (leaveDays || 0))
        });

        return this.payrollRepository.save(payroll);
    }

    async getAttendanceSummary(staffId: string, month: number, year: number) {
        const startDate = moment([year, month - 1]).startOf('month').toDate();
        const endDate = moment([year, month - 1]).endOf('month').toDate();

        const attendance = await this.attendanceRepository.find({
            where: { staffId, date: Between(startDate, endDate) }
        });

        const stats = {
            presentDays: 0,
            absentDays: 0,
            leaveDays: 0,
            unpaidLeaveDays: 0,
        };

        attendance.forEach(record => {
            if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE) {
                stats.presentDays++;
            } else if (record.status === AttendanceStatus.HALF_DAY) {
                stats.presentDays += 0.5;
            } else if (record.status === AttendanceStatus.ABSENT) {
                stats.absentDays++;
            } else if (record.status === AttendanceStatus.ON_LEAVE) {
                stats.leaveDays++;
            }
        });

        // Check leave requests for Paid/Unpaid status
        const leaves = await this.leaveRequestRepository.find({
            where: { staffId, status: LeaveStatus.APPROVED, startDate: Between(startDate, endDate) },
            relations: ['leaveType']
        });

        leaves.forEach(l => {
            if (!l.leaveType.isPaid) {
                stats.unpaidLeaveDays += l.numberOfDays;
            }
            // If attendance wasn't marked ON_LEAVE, we use the leave records
            if (stats.leaveDays === 0) {
                stats.leaveDays += l.numberOfDays;
            }
        });

        return stats;
    }

    async getAnalytics(month: number, year: number) {
        const currentPayrolls = await this.payrollRepository.find({
            where: { month, year },
            relations: ['staff', 'staff.department']
        });

        // 1. Department Spending
        const deptSpending: Record<string, number> = {};
        currentPayrolls.forEach(p => {
            const deptName = p.staff?.department?.name || 'Unassigned';
            deptSpending[deptName] = (deptSpending[deptName] || 0) + Number(p.netSalary);
        });

        const departmentData = Object.entries(deptSpending).map(([name, value]) => ({ name, value }));

        // 2. Monthly Trends (Last 6 months)
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const target = moment([year, month - 1]).subtract(i, 'months');
            const m = target.month() + 1;
            const y = target.year();

            const monthlyPayrolls = await this.payrollRepository.find({
                where: { month: m, year: y }
            });

            trends.push({
                month: target.format('MMM'),
                total: monthlyPayrolls.reduce((sum, p) => sum + Number(p.netSalary), 0)
            });
        }

        return {
            departmentData,
            monthlyTrends: trends,
            totalPayout: currentPayrolls.reduce((sum, p) => sum + Number(p.netSalary), 0),
            totalStaff: currentPayrolls.length,
            paidCount: currentPayrolls.filter(p => p.status === PayrollStatus.PAID).length
        };
    }

    async bulkGenerate(dto: BulkCreatePayrollDto): Promise<{ generated: number; skipped: number }> {
        const { month, year } = dto;
        const activeStaff = await this.staffRepository.find({ where: { status: 'Active' as any } });

        let generated = 0;
        let skipped = 0;

        for (const staff of activeStaff) {
            try {
                // Check if already exists
                const existing = await this.payrollRepository.findOne({
                    where: { staffId: staff.id, month, year }
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                await this.create({
                    staffId: staff.id,
                    month,
                    year,
                    workingDays: 22, // Can be made dynamic or semi-manual
                });
                generated++;
            } catch (error) {
                console.error(`Failed to generate payroll for staff ${staff.id}:`, error);
                skipped++;
            }
        }

        return { generated, skipped };
    }

    async findAll(filters?: { month?: number; year?: number; staffId?: string }): Promise<Payroll[]> {
        const query = this.payrollRepository.createQueryBuilder('payroll')
            .leftJoinAndSelect('payroll.staff', 'staff')
            .leftJoinAndSelect('staff.designation', 'designation')
            .leftJoinAndSelect('staff.department', 'department');

        if (filters?.month) {
            query.andWhere('payroll.month = :month', { month: filters.month });
        }
        if (filters?.year) {
            query.andWhere('payroll.year = :year', { year: filters.year });
        }
        if (filters?.staffId) {
            query.andWhere('payroll.staffId = :staffId', { staffId: filters.staffId });
        }

        query.orderBy('payroll.createdAt', 'DESC');
        return query.getMany();
    }

    async findOne(id: string): Promise<Payroll> {
        const payroll = await this.payrollRepository.findOne({
            where: { id },
            relations: ['staff', 'staff.designation', 'staff.department']
        });

        if (!payroll) {
            throw new NotFoundException(`Payroll record with ID ${id} not found`);
        }

        return payroll;
    }

    async updateStatus(id: string, updateDto: UpdatePayrollStatusDto): Promise<Payroll> {
        const payroll = await this.findOne(id);

        Object.assign(payroll, updateDto);

        if (updateDto.status === PayrollStatus.PAID && !payroll.paymentDate) {
            payroll.paymentDate = new Date();
        }

        return this.payrollRepository.save(payroll);
    }

    async remove(id: string): Promise<void> {
        const payroll = await this.findOne(id);
        if (payroll.status === PayrollStatus.PAID) {
            throw new BadRequestException('Cannot delete a paid payroll record');
        }
        await this.payrollRepository.remove(payroll);
    }
}
