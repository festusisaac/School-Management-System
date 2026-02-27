import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('psychomotor_domains')
export class PsychomotorDomain {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string; // e.g., "Handwriting", "Sports", "Drawing"

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
