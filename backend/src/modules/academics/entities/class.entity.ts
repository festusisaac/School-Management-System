import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Section } from './section.entity';
import { SchoolSection } from './school-section.entity';
import { Staff } from '../../hr/entities/staff.entity';

@Entity('classes')
export class Class {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string; // e.g., "JSS1", "Grade 10"

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => Section, (section) => section.class)
    sections!: Section[];

    @Column({ type: 'uuid', nullable: true })
    schoolSectionId?: string;

    @ManyToOne(() => SchoolSection, (ss) => ss.classes)
    @JoinColumn({ name: 'schoolSectionId' })
    schoolSection?: SchoolSection;

    @Column({ type: 'uuid', nullable: true })
    classTeacherId?: string;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'classTeacherId' })
    classTeacher?: Staff;

    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
