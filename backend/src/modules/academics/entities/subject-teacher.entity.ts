import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Section } from './section.entity';
import { Subject } from './subject.entity';
import { Class } from './class.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('subject_teachers')
export class SubjectTeacher {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    sectionId!: string | null;

    @ManyToOne(() => Section)
    @JoinColumn({ name: 'sectionId' })
    section!: Section;

    @Column({ type: 'uuid', nullable: true })
    classId!: string | null;

    @ManyToOne(() => Class)
    @JoinColumn({ name: 'classId' })
    class!: Class;

    @Column({ type: 'uuid' })
    subjectId!: string;

    @ManyToOne(() => Subject)
    @JoinColumn({ name: 'subjectId' })
    subject!: Subject;

    @Column({ type: 'uuid' })
    teacherId!: string;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'teacherId' })
    teacher!: Staff;

    @Column({ nullable: true })
    tenantId?: string;

    @Column({ type: 'uuid', nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    session?: AcademicSession;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
