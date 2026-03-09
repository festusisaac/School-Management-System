import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', nullable: true })
    schoolPhone!: string;

    @Column({ type: 'varchar', nullable: true })
    schoolMotto!: string;

    // Section 1 - Sessions & Terms Default
    @Index()
    @Column({ type: 'uuid', nullable: true })
    currentSessionId!: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    currentTermId!: string;

    @Column({ type: 'date', nullable: true })
    sessionStartDate!: Date;

    // Section 1 - Localization
    @Column({ type: 'varchar', default: 'DD/MM/YYYY' })
    dateFormat!: string;

    @Column({ type: 'varchar', default: 'UTC' })
    timezone!: string;

    @Column({ type: 'int', default: 1 }) // 0 = Sunday, 1 = Monday...
    startDayOfWeek!: number;

    // Section 2 - Theme & Branding
    @Column({ type: 'varchar', default: '#4f46e5' }) // Indigo-600 default
    primaryColor!: string;

    @Column({ type: 'varchar', default: '#94a3b8' }) // Slate-400 default
    secondaryColor!: string;

    @Column({ type: 'varchar', nullable: true })
    socialFacebook!: string;

    @Column({ type: 'varchar', nullable: true })
    socialTwitter!: string;

    @Column({ type: 'varchar', nullable: true })
    socialInstagram!: string;

    // Logos
    @Column({ type: 'varchar', nullable: true })
    primaryLogo!: string;

    @Column({ type: 'varchar', nullable: true })
    favicon!: string;

    @Column({ type: 'varchar', nullable: true })
    printLogo!: string;

    @Column({ type: 'varchar', nullable: true })
    invoiceLogo!: string;

    @Column({ type: 'varchar', nullable: true })
    documentLogo!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
