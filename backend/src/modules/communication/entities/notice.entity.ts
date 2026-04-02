import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Staff } from '../../hr/entities/staff.entity';

export enum NoticeType {
    ANNOUNCEMENT = 'Announcement',
    ACADEMIC = 'Academic',
    EVENT = 'Event',
    EMERGENCY = 'Emergency',
    MAINTENANCE = 'Maintenance'
}

export enum NoticeAudience {
    ALL = 'All',
    STUDENTS = 'Students',
    STAFF = 'Staff'
}

export enum NoticePriority {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    CRITICAL = 'Critical'
}

@Entity('notices')
export class Notice {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'enum', enum: NoticeType, default: NoticeType.ANNOUNCEMENT })
    type!: NoticeType;

    @Column({ type: 'enum', enum: NoticeAudience, default: NoticeAudience.ALL })
    targetAudience!: NoticeAudience;

    @Column({ type: 'enum', enum: NoticePriority, default: NoticePriority.MEDIUM })
    priority!: NoticePriority;

    @Column({ default: false })
    isSticky!: boolean;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ name: 'author_id', nullable: true })
    authorId?: string | null;

    @ManyToOne(() => Staff, { nullable: true })
    @JoinColumn({ name: 'author_id' })
    author?: Staff | null;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt?: Date;

    @Column({ type: 'json', nullable: true })
    attachments?: string[];

    @Index()
    @Column()
    tenantId!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
