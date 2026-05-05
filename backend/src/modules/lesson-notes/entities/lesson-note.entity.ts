import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { Class } from '../../academics/entities/class.entity';
import { AcademicTerm } from '../../system/entities/academic-term.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('lesson_notes')
export class LessonNote {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @Column({ type: 'uuid' })
    teacherId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'teacherId' })
    teacher!: User;

    @Column({ type: 'uuid' })
    subjectId!: string;

    @ManyToOne(() => Subject)
    @JoinColumn({ name: 'subjectId' })
    subject!: Subject;

    @Column({ type: 'uuid' })
    classId!: string;

    @ManyToOne(() => Class)
    @JoinColumn({ name: 'classId' })
    class!: Class;

    @Column({ type: 'uuid', nullable: true })
    termId?: string;

    @ManyToOne(() => AcademicTerm)
    @JoinColumn({ name: 'termId' })
    term?: AcademicTerm;

    @Column({ type: 'uuid', nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    session?: AcademicSession;

    @Column({ type: 'varchar' })
    topic!: string;

    @Column({ type: 'varchar', nullable: true })
    duration?: string; // e.g., "40 minutes"

    @Column({ type: 'date', nullable: true })
    date?: Date;

    @Column({ type: 'text', nullable: true })
    content?: string; // One big rich-text content field

    @Column({
        type: 'varchar',
        default: 'draft',
    })
    status!: 'draft' | 'submitted' | 'approved' | 'rejected';

    @Column({ type: 'text', nullable: true })
    reviewNotes?: string;

    @Column({ type: 'uuid', nullable: true })
    reviewerId?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewerId' })
    reviewer?: User;

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
