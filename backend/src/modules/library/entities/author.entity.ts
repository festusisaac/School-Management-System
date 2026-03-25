import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, Index } from 'typeorm';
import { Book } from './book.entity';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @ManyToMany(() => Book, (book) => book.authors)
  books?: Book[];

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
