import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('remark_configs')
export class RemarkConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    target!: string; // e.g., "PRINCIPAL", "TEACHER"

    @Column({ type: 'jsonb', nullable: true })
    rules!: {
        minAverage: number; // e.g., 90
        maxAverage: number; // e.g., 100
        remark: string;     // e.g., "An excellent performance, keep it up."
    }[];

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
