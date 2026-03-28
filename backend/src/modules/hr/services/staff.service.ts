import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { Staff, StaffStatus } from '../entities/staff.entity';
import { UsersService } from '../../system/services/users.service';

export interface StaffFilters {
    search?: string;
    departmentId?: string;
    status?: StaffStatus;
    employmentType?: string;
}

@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
        private readonly usersService: UsersService,
    ) { }

    async findAll(filters: StaffFilters = {}, tenantId: string): Promise<Staff[]> {
        const query = this.staffRepository.createQueryBuilder('staff')
            .leftJoinAndSelect('staff.department', 'department')
            .leftJoinAndSelect('staff.roleObject', 'roleObject')
            .where('staff.tenantId = :tenantId', { tenantId })
            .andWhere('staff.status != :inactive', { inactive: StaffStatus.INACTIVE });

        // Apply filters
        if (filters?.search) {
            query.andWhere(
                '(staff.firstName LIKE :search OR staff.lastName LIKE :search OR staff.employeeId LIKE :search OR staff.email LIKE :search)',
                { search: `%${filters.search}%` }
            );
        }

        if (filters?.departmentId) {
            query.andWhere('staff.departmentId = :departmentId', { departmentId: filters.departmentId });
        }


        if (filters?.status) {
            query.andWhere('staff.status = :status', { status: filters.status });
        }

        if (filters?.employmentType) {
            query.andWhere('staff.employmentType = :employmentType', { employmentType: filters.employmentType });
        }

        query.orderBy('staff.firstName', 'ASC');

        return query.getMany();
    }

    async findOne(id: string, tenantId: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { id, tenantId },
            relations: ['department', 'roleObject', 'attendanceRecords', 'leaveRequests', 'payrollRecords'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff member with ID ${id} not found`);
        }

        return staff;
    }

    async findByEmail(email: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { email },
            relations: ['department'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff member with email ${email} not found`);
        }

        return staff;
    }

    async resolveStaffIdByEmail(email: string, tenantId: string): Promise<string | undefined> {
        const staff = await this.staffRepository.findOne({
            where: { email, tenantId },
            select: ['id']
        });
        return staff?.id;
    }

    async findByEmployeeId(employeeId: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { employeeId },
            relations: ['department'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff member with Employee ID ${employeeId} not found`);
        }

        return staff;
    }

    async create(data: Partial<Staff>, tenantId: string, files?: {
        photo?: Express.Multer.File[],
        resume?: Express.Multer.File[],
        joiningLetter?: Express.Multer.File[],
        resignationLetter?: Express.Multer.File[],
        otherDocuments?: Express.Multer.File[],
        certificates?: Express.Multer.File[],
        idProof?: Express.Multer.File[],
        signature?: Express.Multer.File[]
    }): Promise<Staff> {
        // Check for duplicate employee ID
        const existingByEmployeeId = await this.staffRepository.findOne({
            where: { employeeId: data.employeeId, tenantId },
        });

        if (existingByEmployeeId) {
            throw new ConflictException(`Staff member with Employee ID ${data.employeeId} already exists`);
        }

        // Check for duplicate email
        const existingByEmail = await this.staffRepository.findOne({
            where: { email: data.email, tenantId },
        });

        if (existingByEmail) {
            throw new ConflictException(`Staff member with email ${data.email} already exists`);
        }

        // Check for duplicate biometric ID if provided
        if (data.biometricId) {
            const existingByBiometric = await this.staffRepository.findOne({
                where: { biometricId: data.biometricId, tenantId },
            });

            if (existingByBiometric) {
                throw new ConflictException(`Staff member with Biometric ID ${data.biometricId} already exists`);
            }
        }

        const staffData = { ...data, tenantId };

        if (staffData.departmentId === '') {
            staffData.departmentId = null as any;
        }

        if (files) {
            if (files.photo?.[0]) staffData.photo = `/uploads/staff/${files.photo[0].filename}`;
            if (files.resume?.[0]) staffData.resume = `/uploads/staff/${files.resume[0].filename}`;
            if (files.joiningLetter?.[0]) staffData.joiningLetter = `/uploads/staff/${files.joiningLetter[0].filename}`;
            if (files.resignationLetter?.[0]) staffData.resignationLetter = `/uploads/staff/${files.resignationLetter[0].filename}`;
            if (files.otherDocuments) {
                staffData.otherDocuments = files.otherDocuments.map(f => `/uploads/staff/${f.filename}`);
            }
            if (files.certificates) {
                staffData.certificates = files.certificates.map(f => `/uploads/staff/${f.filename}`);
            }
            if (files.idProof?.[0]) staffData.idProof = `/uploads/staff/${files.idProof[0].filename}`;
            if (files.signature?.[0]) staffData.signature = `/uploads/staff/${files.signature[0].filename}`;
        }

        const staff = this.staffRepository.create(staffData);
        const savedStaff = await this.staffRepository.save(staff);

        // Handle user account creation if role/enableLogin is provided
        const staffDto = data as any;
        if (staffDto.enableLogin || staffDto.roleId || staffDto.role) {
            await this.usersService.findOrCreateUser(savedStaff.email, {
                firstName: savedStaff.firstName,
                lastName: savedStaff.lastName,
                roleId: staffDto.roleId,
                role: staffDto.role || (staffDto.roleId ? undefined : 'staff'),
                password: staffDto.password,
                isActive: true,
                tenantId: tenantId,
                photo: savedStaff.photo
            });
        }

        return savedStaff;
    }

    async update(id: string, data: Partial<Staff>, tenantId: string, files?: {
        photo?: Express.Multer.File[],
        resume?: Express.Multer.File[],
        joiningLetter?: Express.Multer.File[],
        resignationLetter?: Express.Multer.File[],
        otherDocuments?: Express.Multer.File[],
        certificates?: Express.Multer.File[],
        idProof?: Express.Multer.File[],
        signature?: Express.Multer.File[]
    }): Promise<Staff> {
        const staff = await this.findOne(id, tenantId);

        // Check for duplicate employee ID if being updated
        if (data.employeeId && data.employeeId !== staff.employeeId) {
            const existing = await this.staffRepository.findOne({
                where: { employeeId: data.employeeId, tenantId },
            });

            if (existing) {
                throw new ConflictException(`Staff member with Employee ID ${data.employeeId} already exists`);
            }
        }

        // Check for duplicate email if being updated
        if (data.email && data.email !== staff.email) {
            const existing = await this.staffRepository.findOne({
                where: { email: data.email, tenantId },
            });

            if (existing) {
                throw new ConflictException(`Staff member with email ${data.email} already exists`);
            }
        }

        // Check for duplicate biometric ID if being updated
        if (data.biometricId && data.biometricId !== staff.biometricId) {
            const existing = await this.staffRepository.findOne({
                where: { biometricId: data.biometricId, tenantId },
            });

            if (existing) {
                throw new ConflictException(`Staff member with Biometric ID ${data.biometricId} already exists`);
            }
        }

        const updateData = { ...data };

        if (updateData.departmentId === '') {
            updateData.departmentId = null as any;
        }

        if (files) {
            if (files.photo?.[0]) updateData.photo = `/uploads/staff/${files.photo[0].filename}`;
            if (files.resume?.[0]) updateData.resume = `/uploads/staff/${files.resume[0].filename}`;
            if (files.joiningLetter?.[0]) updateData.joiningLetter = `/uploads/staff/${files.joiningLetter[0].filename}`;
            if (files.resignationLetter?.[0]) updateData.resignationLetter = `/uploads/staff/${files.resignationLetter[0].filename}`;
            if (files.otherDocuments) {
                updateData.otherDocuments = files.otherDocuments.map(f => `/uploads/staff/${f.filename}`);
            }
            if (files.certificates) {
                updateData.certificates = files.certificates.map(f => `/uploads/staff/${f.filename}`);
            }
            if (files.idProof?.[0]) updateData.idProof = `/uploads/staff/${files.idProof[0].filename}`;
            if (files.signature?.[0]) updateData.signature = `/uploads/staff/${files.signature[0].filename}`;
        }

        Object.assign(staff, updateData);
        const savedStaff = await this.staffRepository.save(staff);

        // Handle user account updates if role/enableLogin is provided
        const staffDto = data as any;
        if (staffDto.enableLogin || staffDto.roleId || staffDto.role) {
            await this.usersService.findOrCreateUser(savedStaff.email, {
                firstName: savedStaff.firstName,
                lastName: savedStaff.lastName,
                roleId: staffDto.roleId,
                role: staffDto.role,
                password: staffDto.password,
                isActive: true,
                tenantId: tenantId,
                photo: savedStaff.photo
            });
        }

        return savedStaff;
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const staff = await this.findOne(id, tenantId);
        const email = staff.email;

        try {
            // Attempt to hard delete staff member
            await this.staffRepository.remove(staff);

            // If staff deletion succeeds, also remove their user account
            await this.usersService.removeByEmail(email, tenantId);
        } catch (error: any) {
            // If deletion fails (likely due to FK constraints), fall back to soft delete
            console.error(`Failed to hard delete staff ${id}, falling back to soft delete:`, error.message);
            staff.status = StaffStatus.INACTIVE;
            await this.staffRepository.save(staff);

            // Also deactivate the user account instead of deleting it
            const user = await this.usersService.findByEmail(email);
            if (user) {
                await this.usersService.update(user.id, { isActive: false });
            }
        }
    }

    async getStatistics(tenantId: string) {
        const total = await this.staffRepository.count({
            where: {
                tenantId,
                status: Not(StaffStatus.INACTIVE)
            }
        });
        const active = await this.staffRepository.count({ where: { status: StaffStatus.ACTIVE, tenantId } });
        const onLeave = await this.staffRepository.count({ where: { status: StaffStatus.ON_LEAVE, tenantId } });
        return {
            total,
            active,
            onLeave,
        };
    }

    async getTeacherDashboardStats(email: string, tenantId: string) {
        const staff = await this.staffRepository.findOne({
            where: { email, tenantId },
            relations: ['department']
        });

        if (!staff) {
            return null;
        }

        const manager = this.staffRepository.manager;
        const staffId = staff.id;
        const today = new Date().getDay(); // 0=Sunday, 1=Monday...
        const dateStr = new Date().toISOString().split('T')[0];

        // 1. Classes Today (from timetable)
        const classesTodayResult = await manager.query(
            `SELECT COUNT(*) as count FROM "timetables" WHERE "teacherId" = $1 AND "dayOfWeek" = $2 AND "tenantId" = $3`,
            [staffId, today, tenantId]
        );
        const classesToday = parseInt(classesTodayResult[0]?.count || '0', 10);

        // 2. Total Students (unique students in classes this teacher teaches)
        const totalStudentsResult = await manager.query(
            `SELECT COUNT(DISTINCT s.id) as count FROM "students" s 
             INNER JOIN "timetables" t ON s."classId" = t."classId" 
             WHERE t."teacherId" = $1 AND s."tenantId" = $2`,
            [staffId, tenantId]
        );
        const totalStudents = parseInt(totalStudentsResult[0]?.count || '0', 10);

        // 3. Pending/Ungraded Homework Count
        const pendingHomeworkResult = await manager.query(
            `SELECT COUNT(*) as count FROM "homework_submissions" hs 
             INNER JOIN "homework" h ON hs."homeworkId" = h.id 
             WHERE h."staffId" = $1 AND h."tenantId" = $2 AND hs.status = 'SUBMITTED' AND hs.grade IS NULL`,
            [staffId, tenantId]
        );
        const pendingHomework = parseInt(pendingHomeworkResult[0]?.count || '0', 10);

        // 4. Missing Registers (as class teacher)
        const attendanceMissingResult = await manager.query(
            `SELECT COUNT(*) as count FROM "classes" c 
             WHERE c."classTeacherId" = $1 AND c."tenantId" = $2 
             AND NOT EXISTS (SELECT 1 FROM "student_attendance" sa WHERE sa."classId" = c.id AND sa.date = $3)`,
            [staffId, tenantId, dateStr]
        );
        const attendanceMissing = parseInt(attendanceMissingResult[0]?.count || '0', 10);

        // 5. Recent Ungraded Submissions (Last 5)
        const recentUngraded = await manager.query(
            `SELECT hs.id, hs."submittedAt", h.title as "homeworkTitle", s."firstName" || ' ' || s."lastName" as "studentName" 
             FROM "homework_submissions" hs 
             INNER JOIN "homework" h ON hs."homeworkId" = h.id 
             INNER JOIN "students" s ON hs."studentId" = s.id 
             WHERE h."staffId" = $1 AND h."tenantId" = $2 AND hs.status = 'SUBMITTED' AND hs.grade IS NULL 
             ORDER BY hs."submittedAt" DESC LIMIT 5`,
            [staffId, tenantId]
        );

        // 6. Leave Summary
        const approvedDaysResult = await manager.query(
            `SELECT SUM("number_of_days") as sum FROM "leave_requests" 
             WHERE "staff_id" = $1 AND "tenant_id" = $2 AND status = 'Approved' 
             AND start_date >= $3`,
            [staffId, tenantId, `${new Date().getFullYear()}-01-01`]
        );
        const pendingRequestsResult = await manager.query(
            `SELECT COUNT(*) as count FROM "leave_requests" 
             WHERE "staff_id" = $1 AND "tenant_id" = $2 AND status = 'Pending'`,
            [staffId, tenantId]
        );

        return {
            totalStudents,
            classesToday,
            pendingHomework,
            attendanceMissing,
            recentUngraded,
            leaveSummary: {
                approvedDays: parseInt(approvedDaysResult[0]?.sum || '0', 10),
                pendingRequests: parseInt(pendingRequestsResult[0]?.count || '0', 10)
            }
        };
    }
}
