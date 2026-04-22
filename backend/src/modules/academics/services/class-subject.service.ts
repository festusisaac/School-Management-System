import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ClassSubject } from '../entities/class-subject.entity';
import { Class } from '../entities/class.entity';
import { CreateClassSubjectDto, BulkAssignClassSubjectsDto, UpdateClassSubjectDto } from '../dto/class-subject.dto';

@Injectable()
export class ClassSubjectService {
    constructor(
        @InjectRepository(ClassSubject)
        private classSubjectRepository: Repository<ClassSubject>,
        @InjectRepository(Class)
        private classRepository: Repository<Class>,
    ) { }

    async findByClass(classId: string, tenantId: string, sectionId?: string, teacherId?: string): Promise<ClassSubject[]> {
        const query = this.classSubjectRepository.createQueryBuilder('cs')
            .leftJoinAndSelect('cs.class', 'class')
            .leftJoinAndSelect('cs.subject', 'subject')
            .leftJoinAndSelect('cs.section', 'section')
            .where('cs.classId = :classId', { classId })
            .andWhere('cs.tenantId = :tenantId', { tenantId });

        if (sectionId) {
            query.andWhere('(cs.sectionId = :sectionId OR cs.sectionId IS NULL)', { sectionId });
        } else {
            query.andWhere('cs.sectionId IS NULL');
        }

        if (teacherId) {
            query.andWhere((qb: any) => {
                const subQuery = qb.subQuery()
                    .select('st.subjectId')
                    .from('subject_teachers', 'st')
                    .where('st.teacherId = :teacherId', { teacherId })
                    .andWhere('st.classId = :classId', { classId })
                    .getQuery();
                return 'cs.subjectId IN (' + subQuery + ')';
            });
        }

        return query.orderBy('subject.name', 'ASC').getMany();
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
        // Fallback: If tenantId is missing from user, get it from the class
        let targetTenantId = tenantId;
        if (!targetTenantId) {
            const cls = await this.classRepository.findOne({ where: { id: dto.classId } });
            if (!cls?.tenantId) {
                throw new BadRequestException('Tenant ID could not be determined for this class');
            }
            targetTenantId = cls.tenantId;
        }

        // Check if already exists
        const existing = await this.classSubjectRepository.findOne({
            where: {
                classId: dto.classId,
                sectionId: dto.sectionId || IsNull(),
                subjectId: dto.subjectId,
                tenantId: targetTenantId,
            },
        });

        if (existing) {
            throw new ConflictException('This subject is already assigned to this class/section');
        }

        const classSubject = this.classSubjectRepository.create({
            ...dto,
            tenantId: targetTenantId,
        });

        const saved = await this.classSubjectRepository.save(classSubject);
        return this.findOne(saved.id, targetTenantId);
    }

    async bulkAssign(dto: BulkAssignClassSubjectsDto, tenantId: string): Promise<ClassSubject[]> {
        const results: ClassSubject[] = [];

        // Fallback: If tenantId is missing from user, get it from the class
        let targetTenantId = tenantId;
        if (!targetTenantId) {
            const cls = await this.classRepository.findOne({ where: { id: dto.classId } });
            if (!cls?.tenantId) {
                throw new BadRequestException('Tenant ID could not be determined for this class');
            }
            targetTenantId = cls.tenantId;
        }

        for (const subjectId of dto.subjectIds) {
            // Check if already exists
            const existing = await this.classSubjectRepository.findOne({
                where: {
                    classId: dto.classId,
                    sectionId: dto.sectionId || IsNull(),
                    subjectId,
                    tenantId: targetTenantId,
                },
            });

            if (!existing) {
                const classSubject = this.classSubjectRepository.create({
                    classId: dto.classId,
                    sectionId: dto.sectionId,
                    subjectId,
                    isCore: dto.isCore ?? true,
                    tenantId: targetTenantId,
                });

                const saved = await this.classSubjectRepository.save(classSubject);
                results.push(await this.findOne(saved.id, targetTenantId));
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

    async replicateForNewSession(oldSessionId: string, newSessionId: string, tenantId: string): Promise<void> {
        const oldAssignments = await this.classSubjectRepository.find({
            where: { sessionId: oldSessionId, tenantId }
        });

        for (const assignment of oldAssignments) {
            // Check if already exists in new session to avoid duplicates
            const existing = await this.classSubjectRepository.findOne({
                where: {
                    classId: assignment.classId,
                    sectionId: assignment.sectionId || IsNull(),
                    subjectId: assignment.subjectId,
                    tenantId,
                    sessionId: newSessionId
                }
            });

            if (!existing) {
                const newAssignment = this.classSubjectRepository.create({
                    classId: assignment.classId,
                    sectionId: assignment.sectionId,
                    subjectId: assignment.subjectId,
                    isCore: assignment.isCore,
                    isActive: assignment.isActive,
                    tenantId,
                    sessionId: newSessionId
                });
                await this.classSubjectRepository.save(newAssignment);
            }
        }
    }
}
