import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ExamGroup } from './exam-group.entity';

@Entity('assessment_types')
export class AssessmentType {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string; // e.g., "CA1", "CA2", "Exam", "Project"

    @Column({ type: 'int', default: 0 })
    maxMarks!: number; // e.g. 10, 20, 60, 100

    @Column({ type: 'int', default: 0 })
    weightage!: number; // Percentage contribution (e.g. 30%)

    @Column({ nullable: true })
    examGroupId?: string;

    @ManyToOne(() => ExamGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examGroupId' })
    examGroup?: ExamGroup;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
