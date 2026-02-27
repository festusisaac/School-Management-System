import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';

@Entity('scratch_cards')
export class ScratchCard {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    serialNumber!: string;

    @Column({ unique: true })
    pin!: string; // Hashed or plain? Usually hashed in production, but for now simple.

    @Column({ type: 'int', default: 0 })
    usageCount!: number;

    @Column({ type: 'int', default: 5 })
    maxUsage!: number;

    @Column({ default: 'ACTIVE' })
    status!: string; // ACTIVE, USED, EXPIRED, BLOCKED

    @Column({ nullable: true })
    usedByStudentId?: string;

    @ManyToOne(() => Student)
    @JoinColumn({ name: 'usedByStudentId' })
    usedByStudent?: Student; // Optional: bind card to first user

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
