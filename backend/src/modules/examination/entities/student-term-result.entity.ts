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
import { ExamGroup } from './exam-group.entity';
import { Class } from '../../academics/entities/class.entity';
import { Section } from '../../academics/entities/section.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('student_term_results')
export class StudentTermResult {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    studentId?: string;

    @ManyToOne(() => Student)
    @JoinColumn({ name: 'studentId' })
    student?: Student;

    @Column({ nullable: true })
    examGroupId?: string;

    @ManyToOne(() => ExamGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examGroupId' })
    examGroup?: ExamGroup;

    @Column({ nullable: true })
    classId?: string;

    @Column({ nullable: true })
    sectionId?: string;

    // Academic Summary
    @Column({ type: 'float', default: 0 })
    totalScore!: number;

    @Column({ type: 'float', default: 0 })
    averageScore!: number;

    @Column({ type: 'int', nullable: true })
    position?: number;

    @Column({ type: 'int', nullable: true })
    totalStudents?: number; // Total students in class at time of result

    // Remarks & Comments
    @Column({ type: 'text', nullable: true })
    principalComment?: string;

    @Column({ type: 'text', nullable: true })
    teacherComment?: string;

    // Attendance
    @Column({ type: 'int', default: 0 })
    daysPresent!: number;

    @Column({ type: 'int', default: 0 })
    daysOpened!: number;

    // Status
    @Column({ default: 'DRAFT' })
    status!: string; // DRAFT, PUBLISHED, WITHHELD

    @Column({ nullable: true })
    tenantId?: string;

    @Column({ type: 'uuid', nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    session?: AcademicSession;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
