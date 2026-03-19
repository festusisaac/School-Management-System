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

    async findAll(): Promise<Department[]> {
        return this.departmentRepository.find({
            where: { isActive: true },
            relations: ['staff', 'headOfDepartment'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id },
            relations: ['staff', 'headOfDepartment'],
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        return department;
    }

    async create(data: Partial<Department>): Promise<Department> {
        // Check for duplicate code
        const existing = await this.departmentRepository.findOne({
            where: { code: data.code },
        });

        if (existing) {
            throw new ConflictException(`Department with code ${data.code} already exists`);
        }
        if (data.headOfDepartmentId === '') {
            data.headOfDepartmentId = null as any;
        }

        const department = this.departmentRepository.create(data);
        const saved = await this.departmentRepository.save(department);
        return this.findOne(saved.id);
    }

    async update(id: string, data: Partial<Department>): Promise<Department> {
        const department = await this.findOne(id);

        // Check for duplicate code if code is being updated
        if (data.code && data.code !== department.code) {
            const existing = await this.departmentRepository.findOne({
                where: { code: data.code },
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
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const department = await this.findOne(id);
        department.isActive = false;
        await this.departmentRepository.save(department);
    }

    async assignHead(departmentId: string, staffId: string): Promise<Department> {
        const department = await this.findOne(departmentId);
        department.headOfDepartmentId = staffId;
        await this.departmentRepository.save(department);
        return this.findOne(departmentId);
    }
}
