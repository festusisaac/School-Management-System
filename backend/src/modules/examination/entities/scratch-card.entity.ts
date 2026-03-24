import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ScratchCardBatch } from './scratch-card-batch.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('scratch_cards')
export class ScratchCard {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    code!: string; // Using 'code' instead of 'serialNumber' to match sample

    @Column()
    pin!: string;

    @Column({ type: 'int', default: 0 })
    usageCount!: number;

    @Column({ type: 'int', default: 5 })
    maxUsage!: number;

    @Column({ default: 'unsold' })
    status!: string; // unsold, sold, redeemed, inactive, expired

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    value!: number;

    @Column({ type: 'timestamp', nullable: true })
    expiryDate?: Date;

    @Column({ nullable: true })
    batchId?: string;

    @ManyToOne(() => ScratchCardBatch, (batch) => batch.cards)
    @JoinColumn({ name: 'batchId' })
    batch?: ScratchCardBatch;

    @Column({ nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    session?: AcademicSession;

    @Column({ nullable: true })
    termId?: string; // We don't have a direct relation here yet, but we'll store the ID

    @Column({ nullable: true })
    studentId?: string;

    @ManyToOne(() => Student)
    @JoinColumn({ name: 'studentId' })
    student?: Student;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: any;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
