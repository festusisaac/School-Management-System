import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { DiscountRule } from './discount-rule.entity';

@Entity({ name: 'discount_profiles' })
export class DiscountProfile {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => DiscountRule, rule => rule.profile, { cascade: true })
    rules!: DiscountRule[];

    @Column({ type: 'timestamp', nullable: true })
    expiryDate!: Date | null;

    @Index()
    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
