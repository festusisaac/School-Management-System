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
    schoolName!: string;

    @Column({ type: 'varchar', nullable: true })
    schoolAddress!: string;

    @Column({ type: 'varchar', nullable: true })
    schoolEmail!: string;

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

    // --- NEW FIELDS ---

    // Financial Settings
    @Column({ type: 'varchar', default: '₦' })
    currencySymbol!: string;

    @Column({ type: 'varchar', default: 'NGN' })
    currencyCode!: string;

    @Column({ type: 'varchar', nullable: true })
    taxNumber!: string;

    @Column({ type: 'varchar', default: 'INV-' })
    invoicePrefix!: string;

    // Student & Staff Prefixes
    @Column({ type: 'varchar', default: 'SCH/' })
    admissionNumberPrefix!: string;

    @Column({ type: 'varchar', default: 'STF/' })
    staffIdPrefix!: string;

    // Enhanced Contact/Social
    @Column({ type: 'varchar', nullable: true })
    officialWebsite!: string;

    @Column({ type: 'varchar', nullable: true })
    whatsappNumber!: string;

    @Column({ type: 'varchar', nullable: true })
    emailFromName!: string;

    @Column({ type: 'varchar', nullable: true })
    socialYoutube!: string;

    @Column({ type: 'varchar', nullable: true })
    socialLinkedin!: string;

    // System/Security
    @Column({ type: 'boolean', default: false })
    isMaintenanceMode!: boolean;

    @Column({ type: 'int', default: 60 }) // in minutes
    sessionTimeoutMinutes!: number;

    @Column({ type: 'int', default: 2 }) // in MB
    maxFileUploadSizeMb!: number;

    @Column({ type: 'boolean', default: false })
    isInitialized!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
