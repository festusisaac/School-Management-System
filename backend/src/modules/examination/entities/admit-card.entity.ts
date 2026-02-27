import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ExamGroup } from './exam-group.entity';

@Entity('admit_cards')
export class AdmitCard {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ default: 'Admit Card Template' })
    templateName!: string;

    @Column({ type: 'jsonb', default: [] })
    sections!: any[]; // Dynamic array of section objects: { type, title, settings, style }

    @Column({ type: 'jsonb', default: {} })
    config!: any; // General configuration: { layout, cardsPerPage, primaryColor, secondaryColor, etc. }

    @Column({ nullable: true })
    examGroupId?: string;

    @ManyToOne(() => ExamGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examGroupId' })
    examGroup?: ExamGroup;

    @Column({ nullable: true })
    tenantId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
