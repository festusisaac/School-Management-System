import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { SubjectGroup } from './subject-group.entity';

@Entity('subjects')
export class Subject {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string; // e.g., "Mathematics", "Biology"



    @Column({ type: 'uuid', nullable: true })
    groupId!: string;

    @ManyToOne(() => SubjectGroup, (group) => group.subjects)
    @JoinColumn({ name: 'groupId' })
    group!: SubjectGroup;

    @Column({ type: 'boolean', default: true })
    isCore!: boolean; // Core subject vs Elective

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
