import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ClassSubject } from '../entities/class-subject.entity';
import { CreateClassSubjectDto, BulkAssignClassSubjectsDto, UpdateClassSubjectDto } from '../dto/class-subject.dto';

@Injectable()
export class ClassSubjectService {
    constructor(
        @InjectRepository(ClassSubject)
        private classSubjectRepository: Repository<ClassSubject>,
    ) { }

    async findByClass(classId: string, tenantId: string, sectionId?: string): Promise<ClassSubject[]> {
        if (sectionId) {
            return this.classSubjectRepository.createQueryBuilder('cs')
                .leftJoinAndSelect('cs.class', 'class')
                .leftJoinAndSelect('cs.subject', 'subject')
                .leftJoinAndSelect('cs.section', 'section')
                .where('cs.classId = :classId', { classId })
                .andWhere('cs.tenantId = :tenantId', { tenantId })
                .andWhere('(cs.sectionId = :sectionId OR cs.sectionId IS NULL)', { sectionId })
                .orderBy('subject.name', 'ASC')
                .getMany();
        }

        return this.classSubjectRepository.find({
            where: { classId, sectionId: IsNull(), tenantId },
            relations: ['class', 'subject', 'section'],
            order: { subject: { name: 'ASC' } },
        });
    }

    async findOne(id: string, tenantId: string): Promise<ClassSubject> {
        const classSubject = await this.classSubjectRepository.findOne({
            where: { id, tenantId },
            relations: ['class', 'subject', 'section'],
        });

        if (!classSubject) {
            throw new NotFoundException('Class subject not found');
        }

        return classSubject;
    }

    async create(dto: CreateClassSubjectDto, tenantId: string): Promise<ClassSubject> {
        // Check if already exists
        const existing = await this.classSubjectRepository.findOne({
            where: {
                classId: dto.classId,
                sectionId: dto.sectionId || IsNull(),
                subjectId: dto.subjectId,
                tenantId,
            },
        });

        if (existing) {
            throw new ConflictException('This subject is already assigned to this class/section');
        }

        const classSubject = this.classSubjectRepository.create({
            ...dto,
            tenantId,
        });

        const saved = await this.classSubjectRepository.save(classSubject);
        return this.findOne(saved.id, tenantId);
    }

    async bulkAssign(dto: BulkAssignClassSubjectsDto, tenantId: string): Promise<ClassSubject[]> {
        const results: ClassSubject[] = [];

        for (const subjectId of dto.subjectIds) {
            // Check if already exists
            const existing = await this.classSubjectRepository.findOne({
                where: {
                    classId: dto.classId,
                    sectionId: dto.sectionId || IsNull(),
                    subjectId,
                    tenantId,
                },
            });

            if (!existing) {
                const classSubject = this.classSubjectRepository.create({
                    classId: dto.classId,
                    sectionId: dto.sectionId,
                    subjectId,
                    isCore: dto.isCore ?? true,
                    tenantId,
                });

                const saved = await this.classSubjectRepository.save(classSubject);
                results.push(await this.findOne(saved.id, tenantId));
            }
        }

        return results;
    }

    async update(id: string, dto: UpdateClassSubjectDto, tenantId: string): Promise<ClassSubject> {
        await this.classSubjectRepository.update({ id, tenantId }, dto);
        return this.findOne(id, tenantId);
    }

    async toggleStatus(id: string, tenantId: string): Promise<ClassSubject> {
        const classSubject = await this.findOne(id, tenantId);
        classSubject.isActive = !classSubject.isActive;
        await this.classSubjectRepository.save(classSubject);
        return this.findOne(id, tenantId);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const classSubject = await this.findOne(id, tenantId);
        await this.classSubjectRepository.remove(classSubject);
    }
}
