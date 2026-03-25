import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { ExamGroup } from './exam-group.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { Class } from '../../academics/entities/class.entity';

@Entity('exams')
export class Exam {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string; // e.g. "Maths Exam Class 1"

    @Column({ nullable: true })
    examGroupId?: string;

    @ManyToOne(() => ExamGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examGroupId' })
    examGroup?: ExamGroup;

    @Column({ nullable: true })
    subjectId?: string;

    @ManyToOne(() => Subject)
    @JoinColumn({ name: 'subjectId' })
    subject?: Subject;

    @Column({ nullable: true })
    classId?: string;

    @ManyToOne(() => Class)
    @JoinColumn({ name: 'classId' })
    class?: Class;

    @Column({ type: 'int', default: 100 })
    totalMarks!: number;

    @Column({ type: 'float', nullable: true })
    highestScore?: number;

    @Column({ type: 'float', nullable: true })
    lowestScore?: number;

    @Column({ type: 'float', nullable: true })
    averageScore?: number;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
