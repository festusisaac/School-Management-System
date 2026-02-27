import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
