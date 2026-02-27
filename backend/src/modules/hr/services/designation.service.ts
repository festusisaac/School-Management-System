import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Designation } from '../entities/designation.entity';

@Injectable()
export class DesignationService {
    constructor(
        @InjectRepository(Designation)
        private readonly designationRepository: Repository<Designation>,
    ) { }

    async findAll(): Promise<Designation[]> {
        return this.designationRepository.find({
            where: { isActive: true },
            order: { level: 'ASC', title: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Designation> {
        const designation = await this.designationRepository.findOne({
            where: { id },
        });

        if (!designation) {
            throw new NotFoundException(`Designation with ID ${id} not found`);
        }

        return designation;
    }

    async create(data: Partial<Designation>): Promise<Designation> {
        // Check for duplicate code
        const existing = await this.designationRepository.findOne({
            where: { code: data.code },
        });

        if (existing) {
            throw new ConflictException(`Designation with code ${data.code} already exists`);
        }

        const designation = this.designationRepository.create(data);
        return this.designationRepository.save(designation);
    }

    async update(id: string, data: Partial<Designation>): Promise<Designation> {
        const designation = await this.findOne(id);

        // Check for duplicate code if code is being updated
        if (data.code && data.code !== designation.code) {
            const existing = await this.designationRepository.findOne({
                where: { code: data.code },
            });

            if (existing) {
                throw new ConflictException(`Designation with code ${data.code} already exists`);
            }
        }

        Object.assign(designation, data);
        return this.designationRepository.save(designation);
    }

    async remove(id: string): Promise<void> {
        const designation = await this.findOne(id);
        designation.isActive = false;
        await this.designationRepository.save(designation);
    }

    async getHierarchy(): Promise<Designation[]> {
        return this.designationRepository.find({
            where: { isActive: true },
            order: { level: 'ASC' },
        });
    }
}
