import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { CbtQuestion } from './cbt-question.entity';

@Entity('cbt_options')
export class CbtOption {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'boolean', default: false })
    isCorrect!: boolean;

    @Column()
    questionId!: string;

    @ManyToOne(() => CbtQuestion, question => question.options, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question?: CbtQuestion;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
