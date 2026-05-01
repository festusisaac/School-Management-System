import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Alumni } from './alumni.entity';
import { AlumniEvent } from './alumni-event.entity';

@Entity('alumni_attendees')
@Index(['eventId', 'alumniId'], { unique: true })
export class AlumniAttendee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @ManyToOne(() => AlumniEvent)
  @JoinColumn({ name: 'eventId' })
  event?: AlumniEvent;

  @Column()
  alumniId!: string;

  @ManyToOne(() => Alumni)
  @JoinColumn({ name: 'alumniId' })
  alumni?: Alumni;

  @Column({ default: 'registered' })
  status!: string; // registered, attended, cancelled

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
