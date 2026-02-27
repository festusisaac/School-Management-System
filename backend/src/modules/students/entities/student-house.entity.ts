import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('student_houses')
export class StudentHouse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    houseName!: string;

    @Column({ nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
