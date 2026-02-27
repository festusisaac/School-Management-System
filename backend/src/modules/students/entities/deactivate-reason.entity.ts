import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Student } from './student.entity';

@Entity('deactivate_reasons')
export class DeactivateReason {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    reason!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Student, (student) => student.deactivateReason)
    students!: Student[];
}
