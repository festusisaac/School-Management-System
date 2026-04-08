import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cms_contacts')
export class CmsContact {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    fullName!: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    phone!: string;

    @Column({ type: 'varchar', nullable: true })
    subject!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'boolean', default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
