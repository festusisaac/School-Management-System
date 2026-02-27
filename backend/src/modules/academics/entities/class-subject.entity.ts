import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Subject } from './subject.entity';
import { Section } from './section.entity';

@Entity('class_subject')
export class ClassSubject {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'class_id' })
    classId!: string;

    @Column({ name: 'section_id', type: 'uuid', nullable: true })
    sectionId?: string;

    @Column({ name: 'subject_id' })
    subjectId!: string;

    @Column({ name: 'is_core', default: true })
    isCore!: boolean;

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ name: 'tenant_id' })
    tenantId!: string;

    @ManyToOne(() => Class, { eager: true })
    @JoinColumn({ name: 'class_id' })
    class!: Class;

    @ManyToOne(() => Section, { eager: true, nullable: true })
    @JoinColumn({ name: 'section_id' })
    section?: Section;

    @ManyToOne(() => Subject, { eager: true })
    @JoinColumn({ name: 'subject_id' })
    subject!: Subject;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
