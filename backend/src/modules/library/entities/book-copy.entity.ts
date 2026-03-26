import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn, OneToMany } from 'typeorm';
import { Book } from './book.entity';
import { Loan } from './loan.entity';

@Entity('book_copies')
export class BookCopy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  bookId!: string;

  @ManyToOne(() => Book, (book) => book.copies)
  @JoinColumn({ name: 'bookId' })
  book?: Book;

  @Column({ nullable: true })
  barcode?: string;

  @Column({ default: 'available' })
  status!: string; // available | loaned | lost

  @Column({ nullable: true })
  location?: string;

  @OneToMany(() => Loan, (loan) => loan.copy)
  loans?: Loan[];

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
