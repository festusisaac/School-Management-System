import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('designations')
export class Designation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    title!: string;

    @Column({ unique: true })
    code!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'int', default: 1 })
    level!: number; // Hierarchy level (1 = highest, e.g., Principal)

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => Staff, staff => staff.designation)
    staff!: Staff[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
