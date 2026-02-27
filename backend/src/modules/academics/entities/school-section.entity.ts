import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Class } from './class.entity';

@Entity('school_sections')
export class SchoolSection {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    name!: string; // e.g., "Nursery", "Primary", "Secondary"

    @Column({ type: 'varchar', nullable: true })
    code?: string; // e.g., "NUR", "PRI", "SEC"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => Class, (cls) => cls.schoolSection)
    classes!: Class[];

    @Column({ type: 'uuid' })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
