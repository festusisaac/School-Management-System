import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) { }

    async findAll(tenantId: string): Promise<Department[]> {
        return this.departmentRepository.find({
            where: { isActive: true, tenantId },
            relations: ['staff', 'headOfDepartment'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id, tenantId },
            relations: ['staff', 'headOfDepartment'],
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        return department;
    }

    async create(data: Partial<Department>, tenantId: string): Promise<Department> {
        // Check for duplicate code
        const existing = await this.departmentRepository.findOne({
            where: { code: data.code, tenantId },
        });

        if (existing) {
            throw new ConflictException(`Department with code ${data.code} already exists`);
        }
        if (data.headOfDepartmentId === '') {
            data.headOfDepartmentId = null as any;
        }

        const department = this.departmentRepository.create({ ...data, tenantId });
        const saved = await this.departmentRepository.save(department);
        return this.findOne(saved.id, tenantId);
    }

    async update(id: string, data: Partial<Department>, tenantId: string): Promise<Department> {
        const department = await this.findOne(id, tenantId);

        // Check for duplicate code if code is being updated
        if (data.code && data.code !== department.code) {
            const existing = await this.departmentRepository.findOne({
                where: { code: data.code, tenantId },
            });

            if (existing) {
                throw new ConflictException(`Department with code ${data.code} already exists`);
            }
        }

        if (data.headOfDepartmentId !== undefined) {
            if (data.headOfDepartmentId) {
                department.headOfDepartment = { id: data.headOfDepartmentId } as any;
            } else {
                department.headOfDepartment = null as any;
                department.headOfDepartmentId = null as any;
            }
        }

        Object.assign(department, data);
        await this.departmentRepository.save(department);
        return this.findOne(id, tenantId);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const department = await this.findOne(id, tenantId);
        department.isActive = false;
        await this.departmentRepository.save(department);
    }

    async assignHead(departmentId: string, staffId: string, tenantId: string): Promise<Department> {
        const department = await this.findOne(departmentId, tenantId);
        department.headOfDepartmentId = staffId;
        await this.departmentRepository.save(department);
        return this.findOne(departmentId, tenantId);
    }
}
