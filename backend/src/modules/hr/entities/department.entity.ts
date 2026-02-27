import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ unique: true })
    code!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ name: 'head_of_department_id', nullable: true })
    headOfDepartmentId!: string;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'head_of_department_id' })
    headOfDepartment!: Staff;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => Staff, staff => staff.department)
    staff!: Staff[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
