import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('student_categories')
export class StudentCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    category!: string;

    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
