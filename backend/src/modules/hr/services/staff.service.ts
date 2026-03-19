import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Staff, StaffStatus } from '../entities/staff.entity';
import { UsersService } from '../../system/services/users.service';

export interface StaffFilters {
    search?: string;
    departmentId?: string;
    designationId?: string;
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

    async findAll(filters?: StaffFilters): Promise<Staff[]> {
        const query = this.staffRepository.createQueryBuilder('staff')
            .leftJoinAndSelect('staff.department', 'department')
            .leftJoinAndSelect('staff.designation', 'designation');

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

        if (filters?.designationId) {
            query.andWhere('staff.designationId = :designationId', { designationId: filters.designationId });
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

    async findOne(id: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { id },
            relations: ['department', 'designation', 'leaveRequests'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff member with ID ${id} not found`);
        }

        return staff;
    }

    async findByEmail(email: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { email },
            relations: ['department', 'designation'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff member with email ${email} not found`);
        }

        return staff;
    }

    async findByEmployeeId(employeeId: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { employeeId },
            relations: ['department', 'designation'],
        });

        if (!staff) {
            throw new NotFoundException(`Staff member with Employee ID ${employeeId} not found`);
        }

        return staff;
    }

    async create(data: Partial<Staff>, files?: {
        photo?: Express.Multer.File[],
        resume?: Express.Multer.File[],
        joiningLetter?: Express.Multer.File[],
        resignationLetter?: Express.Multer.File[],
        otherDocuments?: Express.Multer.File[],
        certificates?: Express.Multer.File[],
        idProof?: Express.Multer.File[]
    }): Promise<Staff> {
        // Check for duplicate employee ID
        const existingByEmployeeId = await this.staffRepository.findOne({
            where: { employeeId: data.employeeId },
        });

        if (existingByEmployeeId) {
            throw new ConflictException(`Staff member with Employee ID ${data.employeeId} already exists`);
        }

        // Check for duplicate email
        const existingByEmail = await this.staffRepository.findOne({
            where: { email: data.email },
        });

        if (existingByEmail) {
            throw new ConflictException(`Staff member with email ${data.email} already exists`);
        }

        // Check for duplicate biometric ID if provided
        if (data.biometricId) {
            const existingByBiometric = await this.staffRepository.findOne({
                where: { biometricId: data.biometricId },
            });

            if (existingByBiometric) {
                throw new ConflictException(`Staff member with Biometric ID ${data.biometricId} already exists`);
            }
        }

        const staffData = { ...data };

        if (staffData.designationId === '') {
            staffData.designationId = null as any;
        }

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
            });
        }

        return savedStaff;
    }

    async update(id: string, data: Partial<Staff>, files?: {
        photo?: Express.Multer.File[],
        resume?: Express.Multer.File[],
        joiningLetter?: Express.Multer.File[],
        resignationLetter?: Express.Multer.File[],
        otherDocuments?: Express.Multer.File[],
        certificates?: Express.Multer.File[],
        idProof?: Express.Multer.File[]
    }): Promise<Staff> {
        const staff = await this.findOne(id);

        // Check for duplicate employee ID if being updated
        if (data.employeeId && data.employeeId !== staff.employeeId) {
            const existing = await this.staffRepository.findOne({
                where: { employeeId: data.employeeId },
            });

            if (existing) {
                throw new ConflictException(`Staff member with Employee ID ${data.employeeId} already exists`);
            }
        }

        // Check for duplicate email if being updated
        if (data.email && data.email !== staff.email) {
            const existing = await this.staffRepository.findOne({
                where: { email: data.email },
            });

            if (existing) {
                throw new ConflictException(`Staff member with email ${data.email} already exists`);
            }
        }

        // Check for duplicate biometric ID if being updated
        if (data.biometricId && data.biometricId !== staff.biometricId) {
            const existing = await this.staffRepository.findOne({
                where: { biometricId: data.biometricId },
            });

            if (existing) {
                throw new ConflictException(`Staff member with Biometric ID ${data.biometricId} already exists`);
            }
        }

        const updateData = { ...data };

        if (updateData.designationId === '') {
            updateData.designationId = null as any;
        }

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
            });
        }

        return savedStaff;
    }

    async remove(id: string): Promise<void> {
        const staff = await this.findOne(id);
        staff.status = StaffStatus.INACTIVE;
        await this.staffRepository.save(staff);
    }


    async getStatistics() {
        const total = await this.staffRepository.count();
        const active = await this.staffRepository.count({ where: { status: StaffStatus.ACTIVE } });
        const onLeave = await this.staffRepository.count({ where: { status: StaffStatus.ON_LEAVE } });
        return {
            total,
            active,
            onLeave,
        };
    }
}
