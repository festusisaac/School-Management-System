import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('student_categories')
export class StudentCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    category!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
