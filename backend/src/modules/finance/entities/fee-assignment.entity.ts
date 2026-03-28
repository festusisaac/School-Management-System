import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeGroup } from './fee-group.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity({ name: 'fee_assignments' })
export class FeeAssignment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    studentId!: string;

    @Column()
    feeGroupId!: string;

    @Column({ nullable: true })
    session!: string;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    excludedHeadIds!: string[] | null;

    @Index()
    @Column({ nullable: true })
    tenantId?: string;

    @Column({ type: 'uuid', nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    academicSession?: AcademicSession;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Student, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student?: Student;

    @ManyToOne(() => FeeGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feeGroupId' })
    feeGroup?: FeeGroup;
}
