import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/** One row per device that has registered for push notifications. */
@Entity('push_tokens')
export class PushToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid' })
    userId!: string;

    @Index()
    @Column()
    tenantId!: string;

    @Column({ unique: true })
    token!: string;

    @Column({ default: 'android' })
    platform!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
