import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable
} from 'typeorm';
import { FeeHead } from './fee-head.entity';

@Entity({ name: 'fee_groups' })
export class FeeGroup {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @ManyToMany(() => FeeHead)
    @JoinTable({
        name: 'fee_group_heads',
        joinColumn: { name: 'feeGroupId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'feeHeadId', referencedColumnName: 'id' }
    })
    heads!: FeeHead[];

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
