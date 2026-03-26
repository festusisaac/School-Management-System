import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../../academics/entities/class.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { Staff } from '../../hr/entities/staff.entity';

export enum OnlineClassPlatform {
    ZOOM = 'ZOOM',
    GOOGLE_MEET = 'GOOGLE_MEET'
}

export enum OnlineClassStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

@Entity('online_classes')
export class OnlineClass {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'timestamp' })
    startTime!: Date;

    @Column({ type: 'timestamp' })
    endTime!: Date;

    @Column({ type: 'enum', enum: OnlineClassPlatform })
    platform!: OnlineClassPlatform;

    @Column({ type: 'varchar' })
    meetingUrl!: string;

    @Column({ type: 'varchar', nullable: true })
    meetingId?: string;

    @Column({ type: 'varchar', nullable: true })
    meetingPassword?: string;

    @Column({ type: 'enum', enum: OnlineClassStatus, default: OnlineClassStatus.SCHEDULED })
    status!: OnlineClassStatus;

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

    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
