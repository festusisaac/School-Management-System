import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('grade_scales')
export class GradeScale {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string; // e.g., "Standard WAEC", "Junior School"

    @Column({ type: 'jsonb', nullable: true })
    grades!: {
        name: string;      // e.g. "A"
        minScore: number;  // e.g. 70
        maxScore: number;  // e.g. 100
        gpa?: number;      // e.g. 5.0
        remark?: string;   // e.g. "Excellent"
        description?: string;
    }[];

    @Column({ default: true })
    isActive!: boolean;

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
