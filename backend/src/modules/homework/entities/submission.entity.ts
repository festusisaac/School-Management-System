import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Homework } from './homework.entity';
import { Student } from '../../students/entities/student.entity';

export enum SubmissionStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    GRADED = 'GRADED',
    RETURNED = 'RETURNED'
}

@Entity('homework_submissions')
export class HomeworkSubmission {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    homeworkId!: string;

    @ManyToOne(() => Homework, (homework) => homework.submissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'homeworkId' })
    homework!: Homework;

    @Column()
    studentId!: string;

    @ManyToOne(() => Student, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student!: Student;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @Column({ type: 'simple-array', nullable: true })
    attachmentUrls?: string[];

    @Column({
        type: 'enum',
        enum: SubmissionStatus,
        default: SubmissionStatus.SUBMITTED
    })
    status!: SubmissionStatus;

    @Column({ nullable: true })
    grade?: string;

    @Column({ type: 'text', nullable: true })
    feedback?: string;

    @Column()
    tenantId!: string;

    @CreateDateColumn()
    submittedAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
