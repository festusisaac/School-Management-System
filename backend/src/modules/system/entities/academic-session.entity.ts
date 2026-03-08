import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { AcademicTerm } from './academic-term.entity';

@Entity('academic_sessions')
export class AcademicSession {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', unique: true })
    name!: string; // e.g. "2025/2026"

    @Column({ type: 'date', nullable: true })
    startDate!: Date;

    @Column({ type: 'date', nullable: true })
    endDate!: Date;

    @Column({ type: 'boolean', default: false })
    isActive!: boolean;

    @OneToMany(() => AcademicTerm, term => term.session)
    terms!: AcademicTerm[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
