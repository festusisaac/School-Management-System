import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from './staff.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('teacher_ratings')
export class TeacherRating {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'teacher_id' })
    teacherId!: string;

    @Column({ name: 'rated_by' })
    ratedBy!: string;

    @Column({ name: 'academic_year' })
    academicYear!: string;

    @Column({ nullable: true })
    term!: string;

    @Column({ nullable: true })
    subject!: string;

    @Column({ name: 'class_id', nullable: true })
    classId!: string;

    // Rating Criteria (1-5 scale)
    @Column({ type: 'int', name: 'teaching_skills' })
    teachingSkills!: number;

    @Column({ type: 'int', name: 'classroom_management' })
    classroomManagement!: number;

    @Column({ type: 'int', name: 'student_engagement' })
    studentEngagement!: number;

    @Column({ type: 'int' })
    punctuality!: number;

    @Column({ type: 'int', name: 'subject_knowledge' })
    subjectKnowledge!: number;

    @Column({ type: 'int' })
    communication!: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, name: 'overall_rating' })
    overallRating!: number;

    @Column({ type: 'text', nullable: true })
    comments!: string;

    @Column({ name: 'rating_date', type: 'date' })
    ratingDate!: Date;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'teacher_id' })
    teacher!: Staff;

    @ManyToOne(() => Student)
    @JoinColumn({ name: 'rated_by' })
    rater!: Student;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
