import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('subject_groups')
export class SubjectGroup {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string; // e.g., "Science", "Arts", "Commercial"

    @Column({ type: 'text', nullable: true })
    description!: string;

    @OneToMany('Subject', 'group')
    subjects!: any[];

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
