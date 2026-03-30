import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MessageTemplateType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: MessageTemplateType,
    default: MessageTemplateType.EMAIL,
  })
  type!: MessageTemplateType;

  @Column({ nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body!: string;

  @Column()
  tenantId!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
