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
import { AffectiveDomain } from './affective-domain.entity';

@Entity('student_skills')
export class StudentSkill {
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
    domainId?: string;

    @ManyToOne(() => AffectiveDomain)
    @JoinColumn({ name: 'domainId' })
    domain?: AffectiveDomain;

    @Column()
    rating!: string; // e.g. "5", "A", "Good"

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
