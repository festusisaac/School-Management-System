import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ScratchCard } from './scratch-card.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Entity('scratch_card_batches')
export class ScratchCardBatch {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'sessionId' })
    session?: AcademicSession;

    @Column({ type: 'int' })
    quantity!: number;

    @Column({ default: 'active' })
    status!: string; // active, inactive

    @Column({ nullable: true })
    createdBy?: string;

    @Column({ nullable: true })
    tenantId?: string;

    @OneToMany(() => ScratchCard, (card) => card.batch)
    cards?: ScratchCard[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
