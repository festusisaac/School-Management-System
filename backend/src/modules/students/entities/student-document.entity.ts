import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Student } from './student.entity';

@Entity('student_documents')
export class StudentDocument {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column()
    filePath!: string;

    @Column({ nullable: true })
    fileType?: string;

    @Column()
    studentId!: string;

    @ManyToOne(() => Student, (student) => student.documents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student?: Student;

    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
