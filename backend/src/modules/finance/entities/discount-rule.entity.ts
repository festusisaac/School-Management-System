import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DiscountProfile } from './discount-profile.entity';
import { FeeHead } from './fee-head.entity';

@Entity({ name: 'discount_rules' })
export class DiscountRule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    profileId!: string;

    @Column()
    feeHeadId!: string;

    @ManyToOne(() => DiscountProfile, profile => profile.rules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profileId' })
    profile!: DiscountProfile;

    @ManyToOne(() => FeeHead)
    @JoinColumn({ name: 'feeHeadId' })
    feeHead!: FeeHead;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    percentage!: string | null;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    fixedAmount!: string | null;

    @Index()
    @Column({ nullable: true })
    tenantId?: string;
}
