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
import { PsychomotorDomain } from './psychomotor-domain.entity';

@Entity('student_psychomotors')
export class StudentPsychomotor {
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

    @ManyToOne(() => PsychomotorDomain)
    @JoinColumn({ name: 'domainId' })
    domain?: PsychomotorDomain;

    @Column()
    rating!: string; // e.g. "5", "A", "Excellent"

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
