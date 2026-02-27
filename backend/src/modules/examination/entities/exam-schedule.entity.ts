import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Exam } from './exam.entity';

@Entity('exam_schedules')
export class ExamSchedule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    examId?: string;

    @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam?: Exam;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'time' })
    endTime!: string;

    @Column({ nullable: true })
    venue!: string; // e.g., "Hall A"

    @Column({ nullable: true })
    invigilatorName?: string;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
