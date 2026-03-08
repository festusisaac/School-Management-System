import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicSession } from '../entities/academic-session.entity';
import { CreateAcademicSessionDto } from '../dtos/create-academic-session.dto';
import { UpdateAcademicSessionDto } from '../dtos/update-academic-session.dto';

@Injectable()
export class AcademicSessionsService {
    constructor(
        @InjectRepository(AcademicSession)
        private readonly sessionRepository: Repository<AcademicSession>,
    ) { }

    async findAll(): Promise<AcademicSession[]> {
        return this.sessionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<AcademicSession> {
        const session = await this.sessionRepository.findOne({ where: { id } });
        if (!session) {
            throw new NotFoundException(`AcademicSession with ID ${id} not found`);
        }
        return session;
    }

    async create(createDto: CreateAcademicSessionDto): Promise<AcademicSession> {
        const session = this.sessionRepository.create(createDto);
        return this.sessionRepository.save(session);
    }

    async update(id: string, updateDto: UpdateAcademicSessionDto): Promise<AcademicSession> {
        const session = await this.findOne(id);
        this.sessionRepository.merge(session, updateDto);
        return this.sessionRepository.save(session);
    }

    async remove(id: string): Promise<void> {
        const session = await this.findOne(id);
        await this.sessionRepository.remove(session);
    }
}
