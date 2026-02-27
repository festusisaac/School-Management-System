import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';

@Entity('exam_groups')
export class ExamGroup {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string; // e.g., "First Term Examination 2025/2026"

    @Column({ nullable: true })
    description?: string;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'date' })
    endDate!: Date;

    @Column({ nullable: true })
    academicYear?: string; // e.g. "2025/2026"

    @Column({ nullable: true })
    term?: string; // e.g. "First Term"

    @Column({ default: true })
    isActive!: boolean;

    @Column({ default: false })
    isPublished!: boolean; // Are results published?

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
