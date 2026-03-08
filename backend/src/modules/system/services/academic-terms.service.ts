import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicTerm } from '../entities/academic-term.entity';
import { CreateAcademicTermDto } from '../dtos/create-academic-term.dto';
import { UpdateAcademicTermDto } from '../dtos/update-academic-term.dto';

@Injectable()
export class AcademicTermsService {
    constructor(
        @InjectRepository(AcademicTerm)
        private readonly termRepository: Repository<AcademicTerm>,
    ) { }

    async findAll(): Promise<AcademicTerm[]> {
        return this.termRepository.find({
            relations: ['session'],
            order: { createdAt: 'DESC' },
        });
    }

    async findAllBySession(sessionId: string): Promise<AcademicTerm[]> {
        return this.termRepository.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
    }

    async findOne(id: string): Promise<AcademicTerm> {
        const term = await this.termRepository.findOne({
            where: { id },
            relations: ['session'],
        });
        if (!term) {
            throw new NotFoundException(`AcademicTerm with ID ${id} not found`);
        }
        return term;
    }

    async create(createDto: CreateAcademicTermDto): Promise<AcademicTerm> {
        const term = this.termRepository.create(createDto);
        return this.termRepository.save(term);
    }

    async update(id: string, updateDto: UpdateAcademicTermDto): Promise<AcademicTerm> {
        const term = await this.findOne(id);
        this.termRepository.merge(term, updateDto);
        return this.termRepository.save(term);
    }

    async remove(id: string): Promise<void> {
        const term = await this.findOne(id);
        await this.termRepository.remove(term);
    }
}
