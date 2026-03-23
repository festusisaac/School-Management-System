import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('student_houses')
export class StudentHouse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    houseName!: string;

    @Column({ nullable: true })
    description?: string;

    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
