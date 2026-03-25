import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ScratchCard } from './scratch-card.entity';

@Entity('scratch_card_logs')
@Index(['ipAddress', 'createdAt'])
@Index(['tenantId', 'createdAt'])
export class ScratchCardLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    scratchCardId?: string;

    @ManyToOne(() => ScratchCard)
    @JoinColumn({ name: 'scratchCardId' })
    scratchCard?: ScratchCard;

    @Column()
    action!: string; // validate, redeem, sell

    @Column({ default: true })
    status!: boolean;

    @Column({ nullable: true })
    failureReason?: string;

    @Column({ type: 'jsonb', nullable: true })
    details?: any;

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    userAgent?: string;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
