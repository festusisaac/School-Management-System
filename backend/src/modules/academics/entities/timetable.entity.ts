import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Section } from './section.entity';
import { Subject } from './subject.entity';
import { TimetablePeriod } from './timetable-period.entity';
import { Staff } from '../../hr/entities/staff.entity';

@Entity('timetables')
export class Timetable {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    classId!: string;

    @ManyToOne(() => Class)
    @JoinColumn({ name: 'classId' })
    class!: Class;

    @Column({ type: 'uuid', nullable: true })
    sectionId!: string | null;

    @ManyToOne(() => Section)
    @JoinColumn({ name: 'sectionId' })
    section!: Section;

    @Column({ type: 'int' })
    dayOfWeek!: number; // 1 = Monday, 2 = Tuesday, ..., 5 = Friday

    @Column({ type: 'uuid' })
    periodId!: string;

    @ManyToOne(() => TimetablePeriod)
    @JoinColumn({ name: 'periodId' })
    period!: TimetablePeriod;

    @Column({ type: 'uuid' })
    subjectId!: string;

    @ManyToOne(() => Subject)
    @JoinColumn({ name: 'subjectId' })
    subject!: Subject;

    @Column({ type: 'uuid', nullable: true })
    teacherId!: string | null; // Optional - can be assigned later

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'teacherId' })
    teacher!: Staff;

    @Column({ type: 'varchar', nullable: true })
    roomNumber!: string | null; // Optional classroom/room number

    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
