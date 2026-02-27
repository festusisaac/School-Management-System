import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../entities/class.entity';
import { Section } from '../entities/section.entity';
import { Subject } from '../entities/subject.entity';
import { SubjectGroup } from '../entities/subject-group.entity';


@Injectable()
export class AcademicsService {
    constructor(
        @InjectRepository(Class)
        private classRepository: Repository<Class>,
        @InjectRepository(Section)
        private sectionRepository: Repository<Section>,
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>,
        @InjectRepository(SubjectGroup)
        private subjectGroupRepository: Repository<SubjectGroup>,

    ) { }

    // --- Classes ---
    async createClass(data: Partial<Class>): Promise<Class> {
        const newClass = this.classRepository.create(data);
        return this.classRepository.save(newClass);
    }

    async getAllClasses(tenantId: string): Promise<Class[]> {
        return this.classRepository.find({
            where: { tenantId },
            relations: ['sections', 'schoolSection', 'classTeacher'],
            order: { name: 'ASC' },
        });
    }

    async getClassById(id: string): Promise<Class> {
        const cls = await this.classRepository.findOne({
            where: { id },
            relations: ['sections', 'schoolSection', 'classTeacher'],
        });
        if (!cls) throw new NotFoundException('Class not found');
        return cls;
    }

    async updateClass(id: string, data: Partial<Class>): Promise<Class> {
        await this.classRepository.update(id, data);
        return this.getClassById(id);
    }

    async deleteClass(id: string): Promise<void> {
        const cls = await this.classRepository.findOne({
            where: { id },
            relations: ['sections'],
        });

        if (!cls) {
            throw new NotFoundException('Class not found');
        }

        // Prevent deletion if class has sections
        if (cls.sections && cls.sections.length > 0) {
            throw new BadRequestException(
                `Cannot delete class "${cls.name}" because it has ${cls.sections.length} section(s). Please delete all sections first.`
            );
        }

        await this.classRepository.remove(cls);
    }

    async toggleClassStatus(id: string): Promise<Class> {
        const cls = await this.getClassById(id);
        cls.isActive = !cls.isActive;
        return this.classRepository.save(cls);
    }

    // --- Sections ---
    async createSection(data: Partial<Section>): Promise<Section> {
        const newSection = this.sectionRepository.create(data);
        return this.sectionRepository.save(newSection);
    }

    async getAllSections(tenantId: string): Promise<Section[]> {
        return this.sectionRepository.find({
            where: { tenantId },
            relations: ['class', 'classTeacher'],
            order: { class: { name: 'ASC' }, name: 'ASC' },
        });
    }

    async getSectionById(id: string): Promise<Section> {
        const section = await this.sectionRepository.findOne({
            where: { id },
            relations: ['class'],
        });
        if (!section) throw new NotFoundException('Section not found');
        return section;
    }

    async updateSection(id: string, data: Partial<Section>): Promise<Section> {
        await this.sectionRepository.update(id, data);
        return this.getSectionById(id);
    }

    async deleteSection(id: string): Promise<void> {
        const section = await this.sectionRepository.findOne({ where: { id } });
        if (!section) throw new NotFoundException('Section not found');
        await this.sectionRepository.remove(section);
    }

    async toggleSectionStatus(id: string): Promise<Section> {
        const section = await this.getSectionById(id);
        section.isActive = !section.isActive;
        return this.sectionRepository.save(section);
    }

    // --- Subjects ---
    async createSubject(data: Partial<Subject>): Promise<Subject> {
        const newSubject = this.subjectRepository.create(data);
        return this.subjectRepository.save(newSubject);
    }

    async getAllSubjects(tenantId: string): Promise<Subject[]> {
        return this.subjectRepository.find({
            where: { tenantId },
            relations: ['group'],
            order: { name: 'ASC' },
        });
    }

    async getSubjectById(id: string): Promise<Subject> {
        const subject = await this.subjectRepository.findOne({
            where: { id },
            relations: ['group'],
        });
        if (!subject) throw new NotFoundException('Subject not found');
        return subject;
    }

    async updateSubject(id: string, data: any): Promise<Subject> {
        // Handle empty string groupId (convert to null)
        const updateData: any = { ...data };
        if (updateData.groupId === '') {
            updateData.groupId = null;
        }

        // Use update() to bypass relation object conflicts
        await this.subjectRepository.update(id, {
            name: updateData.name,
            groupId: updateData.groupId,
            isCore: updateData.isCore,
            isActive: updateData.isActive
        });

        // Reload with relations to ensure the response reflects the update
        return this.getSubjectById(id);
    }

    async deleteSubject(id: string): Promise<void> {
        const subject = await this.subjectRepository.findOne({ where: { id } });
        if (!subject) throw new NotFoundException('Subject not found');
        await this.subjectRepository.remove(subject);
    }

    async toggleSubjectStatus(id: string): Promise<Subject> {
        const subject = await this.getSubjectById(id);
        subject.isActive = !subject.isActive;
        return this.subjectRepository.save(subject);
    }

    // --- Subject Groups ---
    async createSubjectGroup(data: Partial<SubjectGroup>): Promise<SubjectGroup> {
        const newGroup = this.subjectGroupRepository.create(data);
        return this.subjectGroupRepository.save(newGroup);
    }

    async getAllSubjectGroups(tenantId: string): Promise<SubjectGroup[]> {
        return this.subjectGroupRepository.find({
            where: { tenantId },
            relations: ['subjects'],
            order: { name: 'ASC' },
        });
    }

    async getSubjectGroupById(id: string): Promise<SubjectGroup> {
        const group = await this.subjectGroupRepository.findOne({ where: { id } });
        if (!group) throw new NotFoundException('Subject Group not found');
        return group;
    }

    async updateSubjectGroup(id: string, data: Partial<SubjectGroup>): Promise<SubjectGroup> {
        await this.subjectGroupRepository.update(id, data);
        return this.getSubjectGroupById(id);
    }

    async deleteSubjectGroup(id: string): Promise<void> {
        const group = await this.subjectGroupRepository.findOne({ where: { id }, relations: ['subjects'] });
        if (!group) throw new NotFoundException('Subject Group not found');

        if (group.subjects && group.subjects.length > 0) {
            throw new BadRequestException('Cannot delete group with existing subjects');
        }

        await this.subjectGroupRepository.remove(group);
    }

    async toggleSubjectGroupStatus(id: string): Promise<SubjectGroup> {
        const group = await this.getSubjectGroupById(id);
        group.isActive = !group.isActive;
        return this.subjectGroupRepository.save(group);
    }

    // --- Class Teacher Assignment ---
    async assignClassTeacher(sectionId: string, teacherId: string): Promise<Section> {
        const section = await this.sectionRepository.findOne({
            where: { id: sectionId },
            relations: ['class', 'classTeacher'],
        });

        if (!section) {
            throw new NotFoundException('Section not found');
        }

        section.classTeacherId = teacherId;
        return this.sectionRepository.save(section);
    }

    async removeClassTeacher(sectionId: string): Promise<Section> {
        const section = await this.sectionRepository.findOne({
            where: { id: sectionId },
            relations: ['class', 'classTeacher'],
        });

        if (!section) {
            throw new NotFoundException('Section not found');
        }

        // Use update() to explicitly set the column to NULL in the database
        await this.sectionRepository.update(
            { id: sectionId },
            { classTeacherId: null as any } // Cast to any to bypass TypeScript check
        );

        // Reload to ensure classTeacher relation is cleared
        const updated = await this.sectionRepository.findOne({
            where: { id: sectionId },
            relations: ['class', 'classTeacher'],
        });

        if (!updated) {
            throw new NotFoundException('Section not found after update');
        }

        return updated;
    }

    // --- Direct Class Teacher Assignment (for schools without sections) ---
    async assignClassTeacherDirect(classId: string, teacherId: string): Promise<Class> {
        const cls = await this.classRepository.findOne({
            where: { id: classId },
            relations: ['classTeacher'],
        });

        if (!cls) {
            throw new NotFoundException('Class not found');
        }

        cls.classTeacherId = teacherId;
        return this.classRepository.save(cls);
    }

    async removeClassTeacherDirect(classId: string): Promise<Class> {
        const cls = await this.classRepository.findOne({
            where: { id: classId },
            relations: ['classTeacher'],
        });

        if (!cls) {
            throw new NotFoundException('Class not found');
        }

        // Use update() to explicitly set the column to NULL in the database
        await this.classRepository.update(
            { id: classId },
            { classTeacherId: null as any } // Cast to any to bypass TypeScript check
        );

        // Reload to ensure classTeacher relation is cleared
        const updated = await this.classRepository.findOne({
            where: { id: classId },
            relations: ['classTeacher'],
        });

        if (!updated) {
            throw new NotFoundException('Class not found after update');
        }

        return updated;
    }


}
