import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { HomeworkSubmission } from './submission.entity';
import { Class } from '../../academics/entities/class.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('homework')
export class Homework {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'timestamp' })
    dueDate!: Date;

    @Column({ type: 'varchar', nullable: true })
    attachmentUrl?: string;

    @Column({ type: 'uuid' })
    classId!: string;

    @ManyToOne(() => Class)
    @JoinColumn({ name: 'classId' })
    class!: Class;

    @Column({ type: 'uuid' })
    subjectId!: string;

    @ManyToOne(() => Subject)
    @JoinColumn({ name: 'subjectId' })
    subject!: Subject;

    @Column({ type: 'uuid' })
    teacherId!: string;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'teacherId' })
    teacher!: Staff;

    @Column()
    tenantId!: string;

    @Column({ type: 'uuid', nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    session?: AcademicSession;

    @OneToMany(() => HomeworkSubmission, (submission) => submission.homework)
    submissions!: HomeworkSubmission[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
