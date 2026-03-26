import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { AcademicSession } from './academic-session.entity';

@Entity('academic_terms')
export class AcademicTerm {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string; // e.g. "First Term"

    @Index()
    @Column({ type: 'uuid' })
    sessionId!: string;

    @ManyToOne(() => AcademicSession, session => session.terms, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sessionId' })
    session!: AcademicSession;

    @Column({ type: 'date', nullable: true })
    startDate!: Date;

    @Column({ type: 'date', nullable: true })
    endDate!: Date;

    @Column({ type: 'boolean', default: false })
    isActive!: boolean;

    @Column({ type: 'int', default: 0 })
    daysOpened!: number;

    @Column({ type: 'date', nullable: true })
    nextTermStartDate!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
