import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Staff } from '../../hr/entities/staff.entity';

@Entity('sections')
export class Section {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string; // e.g., "A", "Blue", "Gold"

    @Column({ type: 'uuid' })
    classId!: string;

    @ManyToOne(() => Class, (cls) => cls.sections)
    @JoinColumn({ name: 'classId' })
    class!: Class;

    @Column({ type: 'uuid', nullable: true })
    classTeacherId?: string;

    @ManyToOne(() => Staff, { nullable: true })
    @JoinColumn({ name: 'classTeacherId' })
    classTeacher?: Staff;



    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
