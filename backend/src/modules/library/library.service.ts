import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, ILike } from 'typeorm';
import { Book } from './entities/book.entity';
import { Author } from './entities/author.entity';
import { Category } from './entities/category.entity';
import { BookCopy } from './entities/book-copy.entity';
import { Loan } from './entities/loan.entity';
import { Fine } from './entities/fine.entity';
import { CreateBookDto } from './dtos/create-book.dto';
import { IssueLoanDto } from './dtos/issue-loan.dto';
import { ReturnLoanDto } from './dtos/return-loan.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Book)
    private bookRepo: Repository<Book>,
    @InjectRepository(Author)
    private authorRepo: Repository<Author>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(BookCopy)
    private copyRepo: Repository<BookCopy>,
    @InjectRepository(Loan)
    private loanRepo: Repository<Loan>,
    @InjectRepository(Fine)
    private fineRepo: Repository<Fine>,
  ) {}

  async createBook(dto: CreateBookDto, tenantId: string, coverPath?: string): Promise<Book> {
    const book = this.bookRepo.create({
      title: dto.title,
      isbn: dto.isbn,
      publisher: dto.publisher,
      publishedDate: dto.publishedDate,
      description: dto.description,
      coverPath,
      tenantId,
    });

    if (dto.authorIds && dto.authorIds.length > 0) {
      const authors = await this.authorRepo.find({ where: { id: In(dto.authorIds), tenantId } });
      book.authors = authors;
    }
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const categories = await this.categoryRepo.find({ where: { id: In(dto.categoryIds), tenantId } });
      book.categories = categories;
    }

    return this.bookRepo.save(book);
  }

  async findAllBooks(query: any, tenantId: string): Promise<Book[]> {
    const where: any = { tenantId };
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      return this.bookRepo.find({
        where: [
          { ...where, title: ILike(kw) },
          { ...where, isbn: ILike(kw) },
          { ...where, publisher: ILike(kw) },
        ],
        relations: ['authors', 'categories', 'copies'],
      });
    }

    return this.bookRepo.find({ where, relations: ['authors', 'categories', 'copies'] });
  }

  async findOneBook(id: string, tenantId: string): Promise<Book> {
    const book = await this.bookRepo.findOne({ where: { id, tenantId }, relations: ['authors', 'categories', 'copies'] });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async createCopy(bookId: string, tenantId: string, barcode?: string, location?: string): Promise<BookCopy> {
    const book = await this.bookRepo.findOneBy({ id: bookId, tenantId });
    if (!book) throw new NotFoundException('Book not found');

    const copy = this.copyRepo.create({ bookId, barcode, location, tenantId });
    return this.copyRepo.save(copy);
  }

  async issueLoan(dto: IssueLoanDto, tenantId: string): Promise<Loan> {
    const copy = await this.copyRepo.findOne({ where: { id: dto.copyId, tenantId } });
    if (!copy) throw new NotFoundException('Copy not found');
    if (copy.status !== 'available') throw new ConflictException('Copy not available');

    const loan = this.loanRepo.create({
      copyId: dto.copyId,
      borrowerId: dto.borrowerId,
      issuedAt: new Date(),
      dueAt: new Date(dto.dueAt),
      status: 'active',
      tenantId,
    });

    copy.status = 'loaned';
    await this.copyRepo.save(copy);
    return this.loanRepo.save(loan);
  }

  async returnLoan(dto: ReturnLoanDto, tenantId: string): Promise<Loan> {
    const loan = await this.loanRepo.findOne({ where: { id: dto.loanId, tenantId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status === 'returned') return loan;

    loan.returnedAt = dto.returnedAt || new Date();
    loan.status = 'returned';
    await this.loanRepo.save(loan);

    // Update copy status
    if (loan.copyId) {
      const copy = await this.copyRepo.findOneBy({ id: loan.copyId, tenantId });
      if (copy) {
        copy.status = 'available';
        await this.copyRepo.save(copy);
      }
    }

    // Calculate fine if overdue
    const now = loan.returnedAt || new Date();
    if (loan.dueAt && now > loan.dueAt) {
      const fineAmount = this.calculateFine(loan.dueAt, now);
      if (fineAmount > 0) {
        const fine = this.fineRepo.create({ loanId: loan.id, amount: fineAmount, paid: false, tenantId });
        await this.fineRepo.save(fine);
      }
    }

    return loan;
  }

  calculateFine(dueAt: Date, returnedAt: Date, graceDays = 3, finePerDay = 50): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const overdueMs = returnedAt.getTime() - dueAt.getTime();
    const overdueDays = Math.floor(overdueMs / msPerDay);
    const chargeable = Math.max(0, overdueDays - graceDays);
    return chargeable > 0 ? chargeable * finePerDay : 0;
  }

  async findOverdues(tenantId: string): Promise<Loan[]> {
    const now = new Date();
    return this.loanRepo.find({ where: { tenantId, status: 'active', dueAt: LessThan(now) }, relations: ['copy'] });
  }
}
