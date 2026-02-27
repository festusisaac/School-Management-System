import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('affective_domains')
export class AffectiveDomain {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string; // e.g., "Punctuality", "Neatness", "Politeness"

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
