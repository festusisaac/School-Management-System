import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnlineClass, OnlineClassStatus } from '../entities/online-class.entity';
import { CreateOnlineClassDto } from '../dto/create-online-class.dto';
import { UpdateOnlineClassDto } from '../dto/update-online-class.dto';

@Injectable()
export class OnlineClassesService {
    constructor(
        @InjectRepository(OnlineClass)
        private readonly onlineClassRepository: Repository<OnlineClass>,
    ) {}

    async create(createDto: CreateOnlineClassDto, tenantId: string): Promise<OnlineClass> {
        const onlineClass = this.onlineClassRepository.create({
            ...createDto,
            tenantId,
        });
        return await this.onlineClassRepository.save(onlineClass);
    }

    async findAll(tenantId: string, filters: { classId?: string; subjectId?: string; teacherId?: string; status?: OnlineClassStatus }): Promise<OnlineClass[]> {
        const query = this.onlineClassRepository.createQueryBuilder('oc')
            .leftJoinAndSelect('oc.class', 'class')
            .leftJoinAndSelect('oc.subject', 'subject')
            .leftJoinAndSelect('oc.teacher', 'teacher')
            .where('oc.tenantId = :tenantId', { tenantId });

        if (filters.classId) {
            query.andWhere('oc.classId = :classId', { classId: filters.classId });
        }
        if (filters.subjectId) {
            query.andWhere('oc.subjectId = :subjectId', { subjectId: filters.subjectId });
        }
        if (filters.teacherId) {
            query.andWhere('oc.teacherId = :teacherId', { teacherId: filters.teacherId });
        }
        if (filters.status) {
            query.andWhere('oc.status = :status', { status: filters.status });
        }

        return await query.orderBy('oc.startTime', 'ASC').getMany();
    }

    async findOne(id: string, tenantId: string): Promise<OnlineClass> {
        const onlineClass = await this.onlineClassRepository.findOne({
            where: { id, tenantId },
            relations: ['class', 'subject', 'teacher'],
        });

        if (!onlineClass) {
            throw new NotFoundException(`Online class with ID ${id} not found`);
        }

        return onlineClass;
    }

    async update(id: string, updateDto: UpdateOnlineClassDto, tenantId: string): Promise<OnlineClass> {
        const onlineClass = await this.findOne(id, tenantId);
        Object.assign(onlineClass, updateDto);
        return await this.onlineClassRepository.save(onlineClass);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const onlineClass = await this.findOne(id, tenantId);
        await this.onlineClassRepository.remove(onlineClass);
    }

    async findUpcoming(tenantId: string, classId?: string): Promise<OnlineClass[]> {
        const query = this.onlineClassRepository.createQueryBuilder('oc')
            .leftJoinAndSelect('oc.class', 'class')
            .leftJoinAndSelect('oc.subject', 'subject')
            .leftJoinAndSelect('oc.teacher', 'teacher')
            .where('oc.tenantId = :tenantId', { tenantId })
            .andWhere('oc.endTime > :now', { now: new Date() })
            .andWhere('oc.status IN (:...statuses)', { statuses: [OnlineClassStatus.SCHEDULED, OnlineClassStatus.IN_PROGRESS] });

        if (classId) {
            query.andWhere('oc.classId = :classId', { classId });
        }

        return await query.orderBy('oc.startTime', 'ASC').getMany();
    }
}
