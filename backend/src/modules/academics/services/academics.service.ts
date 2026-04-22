import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
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
        const createData: any = { ...data };
        if (createData.schoolSectionId === '') createData.schoolSectionId = null;
        if (createData.classTeacherId === '') createData.classTeacherId = null;

        const newClass = this.classRepository.create(createData as Partial<Class>);
        return this.classRepository.save(newClass) as Promise<Class>;
    }

    async getAllClasses(tenantId: string, teacherId?: string): Promise<Class[]> {
        const query = this.classRepository.createQueryBuilder('class')
            .leftJoinAndSelect('class.sections', 'sections')
            .leftJoinAndSelect('class.schoolSection', 'schoolSection')
            .leftJoinAndSelect('class.classTeacher', 'classTeacher')
            .where('class.tenantId = :tenantId', { tenantId });

        if (teacherId) {
            query.andWhere(new Brackets(qb => {
                qb.where('class.classTeacherId = :teacherId', { teacherId })
                    .orWhere('sections.classTeacherId = :teacherId', { teacherId })
                    .orWhere((qb2: any) => {
                        const subQuery = qb2.subQuery()
                            .select('st.classId')
                            .from('subject_teachers', 'st')
                            .where('st.teacherId = :teacherId', { teacherId })
                            .getQuery();
                        return 'class.id IN (' + subQuery + ')';
                    });
            }));
        }

        return query.orderBy('class.name', 'ASC').getMany();
    }

    async getClassById(id: string): Promise<Class> {
        const cls = await this.classRepository.findOne({
            where: { id },
            relations: ['sections', 'schoolSection', 'classTeacher'],
        });
        if (!cls) throw new NotFoundException('Class not found');
        return cls;
    }

    async updateClass(id: string, data: any): Promise<Class> {
        const updateData = { ...data };
        if (updateData.schoolSectionId === '') updateData.schoolSectionId = null;
        if (updateData.classTeacherId === '') updateData.classTeacherId = null;

        await this.classRepository.update(id, {
            name: updateData.name,
            schoolSectionId: updateData.schoolSectionId,
            classTeacherId: updateData.classTeacherId,
            isActive: updateData.isActive
        });
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

        // Check for students in this class
        const studentCount = await this.classRepository.manager.query(
            'SELECT COUNT(*) FROM students WHERE "classId" = $1',
            [id]
        );
        if (parseInt(studentCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete class "${cls.name}" because it has ${studentCount[0].count} student(s) assigned.`);
        }

        // Check for timetable slots in this class
        const timetableCount = await this.classRepository.manager.query(
            'SELECT COUNT(*) FROM timetables WHERE "classId" = $1',
            [id]
        );
        if (parseInt(timetableCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete class "${cls.name}" because it has ${timetableCount[0].count} timetable slot(s).`);
        }

        // Check for subject teacher assignments in this class
        const teacherCount = await this.classRepository.manager.query(
            'SELECT COUNT(*) FROM subject_teachers WHERE "classId" = $1',
            [id]
        );
        if (parseInt(teacherCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete class "${cls.name}" because it has ${teacherCount[0].count} teacher assignment(s).`);
        }

        // Check for class subject mappings in this class
        const subjectCount = await this.classRepository.manager.query(
            'SELECT COUNT(*) FROM class_subject WHERE class_id = $1',
            [id]
        );
        if (parseInt(subjectCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete class "${cls.name}" because it has ${subjectCount[0].count} subject mapping(s).`);
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
        const createData: any = { ...data };
        if (createData.classTeacherId === '') createData.classTeacherId = null;

        const newSection = this.sectionRepository.create(createData as Partial<Section>);
        return this.sectionRepository.save(newSection) as Promise<Section>;
    }

    async getAllSections(tenantId: string, teacherId?: string): Promise<Section[]> {
        const query = this.sectionRepository.createQueryBuilder('section')
            .leftJoinAndSelect('section.class', 'class')
            .leftJoinAndSelect('section.classTeacher', 'classTeacher')
            .where('section.tenantId = :tenantId', { tenantId });

        if (teacherId) {
            query.andWhere(new Brackets(qb => {
                qb.where('section.classTeacherId = :teacherId', { teacherId })
                    .orWhere((qb2: any) => {
                        const subQuery = qb2.subQuery()
                            .select('st.sectionId')
                            .from('subject_teachers', 'st')
                            .where('st.teacherId = :teacherId', { teacherId })
                            .getQuery();
                        return 'section.id IN (' + subQuery + ')';
                    });
            }));
        }

        return query.orderBy('class.name', 'ASC')
            .addOrderBy('section.name', 'ASC')
            .getMany();
    }

    async getSectionById(id: string): Promise<Section> {
        const section = await this.sectionRepository.findOne({
            where: { id },
            relations: ['class'],
        });
        if (!section) throw new NotFoundException('Section not found');
        return section;
    }

    async updateSection(id: string, data: any): Promise<Section> {
        const updateData = { ...data };
        if (updateData.classTeacherId === '') updateData.classTeacherId = null;

        await this.sectionRepository.update(id, {
            name: updateData.name,
            classId: updateData.classId,
            classTeacherId: updateData.classTeacherId,
            isActive: updateData.isActive
        });
        return this.getSectionById(id);
    }

    async deleteSection(id: string): Promise<void> {
        const section = await this.sectionRepository.findOne({ where: { id } });
        if (!section) throw new NotFoundException('Section not found');

        // Check for students in this section
        const studentCount = await this.sectionRepository.manager.query(
            'SELECT COUNT(*) FROM students WHERE "sectionId" = $1',
            [id]
        );
        if (parseInt(studentCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete section "${section.name}" because it has ${studentCount[0].count} student(s) assigned.`);
        }

        // Check for timetable slots in this section
        const timetableCount = await this.sectionRepository.manager.query(
            'SELECT COUNT(*) FROM timetables WHERE "sectionId" = $1',
            [id]
        );
        if (parseInt(timetableCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete section "${section.name}" because it has ${timetableCount[0].count} timetable slot(s).`);
        }

        // Check for subject teacher assignments in this section
        const teacherCount = await this.sectionRepository.manager.query(
            'SELECT COUNT(*) FROM subject_teachers WHERE "sectionId" = $1',
            [id]
        );
        if (parseInt(teacherCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete section "${section.name}" because it has ${teacherCount[0].count} teacher assignment(s).`);
        }

        // Check for class subject mappings in this section
        const subjectCount = await this.sectionRepository.manager.query(
            'SELECT COUNT(*) FROM class_subject WHERE section_id = $1',
            [id]
        );
        if (parseInt(subjectCount[0].count) > 0) {
            throw new BadRequestException(`Cannot delete section "${section.name}" because it has ${subjectCount[0].count} subject mapping(s).`);
        }

        await this.sectionRepository.remove(section);
    }

    async toggleSectionStatus(id: string): Promise<Section> {
        const section = await this.getSectionById(id);
        section.isActive = !section.isActive;
        return this.sectionRepository.save(section);
    }

    // --- Subjects ---
    async createSubject(data: Partial<Subject>): Promise<Subject> {
        const createData: any = { ...data };
        if (createData.groupId === '') createData.groupId = null;

        const newSubject = this.subjectRepository.create(createData as Partial<Subject>);
        return this.subjectRepository.save(newSubject) as Promise<Subject>;
    }

    async getAllSubjects(tenantId: string, teacherId?: string): Promise<Subject[]> {
        const query = this.subjectRepository.createQueryBuilder('subject')
            .leftJoinAndSelect('subject.group', 'group')
            .where('subject.tenantId = :tenantId', { tenantId });

        if (teacherId) {
            query.andWhere((qb: any) => {
                const subQuery = qb.subQuery()
                    .select('st.subjectId')
                    .from('subject_teachers', 'st')
                    .where('st.teacherId = :teacherId', { teacherId })
                    .getQuery();
                return 'subject.id IN (' + subQuery + ')';
            });
        }

        return query.orderBy('subject.name', 'ASC').getMany();
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

    async getAllSubjectGroups(tenantId: string, teacherId?: string): Promise<SubjectGroup[]> {
        const query = this.subjectGroupRepository.createQueryBuilder('group')
            .leftJoinAndSelect('group.subjects', 'subjects')
            .where('group.tenantId = :tenantId', { tenantId });

        if (teacherId) {
            query.andWhere((qb: any) => {
                const subQuery = qb.subQuery()
                    .select('st.subjectId')
                    .from('subject_teachers', 'st')
                    .where('st.teacherId = :teacherId', { teacherId })
                    .getQuery();
                
                // Only show groups that have at least one subject assigned to this teacher
                return 'subjects.id IN (' + subQuery + ')';
            });
        }

        return query.orderBy('group.name', 'ASC').getMany();
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
