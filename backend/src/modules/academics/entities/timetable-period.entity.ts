import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PeriodType {
    LESSON = 'LESSON',
    ASSEMBLY = 'ASSEMBLY',
    BREAK = 'BREAK',
    LUNCH = 'LUNCH',
    GAMES = 'GAMES',
    ACTIVITY = 'ACTIVITY'
}

@Entity('timetable_periods')
export class TimetablePeriod {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({
        type: 'enum',
        enum: PeriodType,
        default: PeriodType.LESSON
    })
    type!: PeriodType;

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'time' })
    endTime!: string;

    @Column('int')
    periodOrder!: number;

    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @UpdateDateColumn()
    updatedAt: Date = new Date();
}
