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

    @Column({ type: 'int', default: 3 }) // in MB
    maxFileUploadSizeMb!: number;

    @Column({ type: 'boolean', default: false })
    isInitialized!: boolean;

    // Online Admission Settings
    @Column({ type: 'boolean', default: false })
    onlineAdmissionEnabled!: boolean;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    admissionFee!: number;

    @Column({ type: 'varchar', default: 'ADM/' })
    admissionReferencePrefix!: string;

    @Column({ type: 'text', nullable: true })
    admissionInstructions!: string;

    // Notice Bar Settings
    @Column({ type: 'boolean', default: false })
    isNoticeActive!: boolean;

    @Column({ type: 'text', nullable: true })
    noticeText!: string;

    @Column({ type: 'varchar', nullable: true })
    noticeLink!: string;

    // Payment Gateway Settings
    @Column({ type: 'varchar', nullable: true })
    paystackPublicKey!: string;

    @Column({ type: 'varchar', nullable: true })
    paystackSecretKey!: string;

    @Column({ type: 'varchar', nullable: true })
    flutterwavePublicKey!: string;

    @Column({ type: 'varchar', nullable: true })
    flutterwaveSecretKey!: string;

    // SEO Settings
    @Column({ type: 'varchar', nullable: true })
    seoTitle!: string;

    @Column({ type: 'text', nullable: true })
    seoDescription!: string;

    @Column({ type: 'text', nullable: true })
    seoKeywords!: string;

    @Column({ type: 'varchar', nullable: true })
    ogImage!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
