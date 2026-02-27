import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeGroup } from './fee-group.entity';

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
