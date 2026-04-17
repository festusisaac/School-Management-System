import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Exam } from './exam.entity';
import { CbtOption } from './cbt-option.entity';

@Entity('cbt_questions')
export class CbtQuestion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'int', default: 1 })
    marks!: number;

    @Column({ nullable: true })
    examId?: string;

    @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam?: Exam;

    @Column({ nullable: true })
    tenantId?: string;

    @OneToMany(() => CbtOption, option => option.question, { cascade: true })
    options!: CbtOption[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
