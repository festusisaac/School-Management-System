import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Exam } from './exam.entity';
import { Student } from '../../students/entities/student.entity';
import { ExamGroup } from './exam-group.entity';
import { Class } from '../../academics/entities/class.entity';
import { Section } from '../../academics/entities/section.entity';
import { AssessmentType } from './assessment-type.entity';
import { Subject } from '../../academics/entities/subject.entity';

@Entity('exam_results')
export class ExamResult {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ nullable: true })
    examId?: string;

    @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam?: Exam;

    @Column({ nullable: true })
    assessmentTypeId?: string;

    @ManyToOne(() => AssessmentType, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assessmentTypeId' })
    assessmentType?: AssessmentType;

    @Index()
    @Column({ nullable: true })
    studentId?: string;

    @ManyToOne(() => Student)
    @JoinColumn({ name: 'studentId' })
    student?: Student;

    @Column({ type: 'float', default: 0 })
    score!: number; // The secured mark

    @Column({ type: 'float', default: 0 })
    maxMarks!: number; // The max mark possible (usually from AssessmentType)

    @Column({ nullable: true })
    status?: string; // PRESENT, ABSENT, EXEMPT

    // Denormalized fields for faster queries
    @Index()
    @Column({ nullable: true })
    classId?: string;

    @Column({ nullable: true })
    sectionId?: string;

    @Index()
    @Column({ nullable: true })
    subjectId?: string;

    @Column({ nullable: true })
    examGroupId?: string;

    @Index()
    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
