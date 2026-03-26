import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany, Index } from 'typeorm';
import { Author } from './author.entity';
import { Category } from './category.entity';
import { BookCopy } from './book-copy.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  isbn?: string;

  @Column({ nullable: true })
  publisher?: string;

  @Column({ type: 'date', nullable: true })
  publishedDate?: Date;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true })
  coverPath?: string;

  @Column({ nullable: true })
  edition?: string;

  @Column({ nullable: true })
  language?: string;

  @ManyToMany(() => Author, (author) => author.books, { cascade: true })
  @JoinTable({ name: 'book_authors', joinColumn: { name: 'bookId' }, inverseJoinColumn: { name: 'authorId' } })
  authors?: Author[];

  @ManyToMany(() => Category, (category) => category.books, { cascade: true })
  @JoinTable({ name: 'book_categories', joinColumn: { name: 'bookId' }, inverseJoinColumn: { name: 'categoryId' } })
  categories?: Category[];

  @OneToMany(() => BookCopy, (copy) => copy.book)
  copies?: BookCopy[];

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
