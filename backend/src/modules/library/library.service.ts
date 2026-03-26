import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, ILike, DeepPartial } from 'typeorm';
import { Book } from './entities/book.entity';
import { Author } from './entities/author.entity';
import { Category } from './entities/category.entity';
import { BookCopy } from './entities/book-copy.entity';
import { Loan } from './entities/loan.entity';
import { Fine } from './entities/fine.entity';
import { CreateBookDto } from './dtos/create-book.dto';
import { IssueLoanDto } from './dtos/issue-loan.dto';
import { ReturnLoanDto } from './dtos/return-loan.dto';
import { CreateAuthorDto, UpdateAuthorDto } from './dtos/author.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos/category.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { LibrarySetting } from './entities/library-setting.entity';

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
    @InjectRepository(LibrarySetting)
    private settingsRepo: Repository<LibrarySetting>,
  ) {}

  // Author CRUD
  async createAuthor(dto: CreateAuthorDto, tenantId: string): Promise<Author> {
    const author = this.authorRepo.create({ ...dto, tenantId });
    return this.authorRepo.save(author);
  }

  async findAllAuthors(tenantId: string): Promise<Author[]> {
    return this.authorRepo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async updateAuthor(id: string, dto: UpdateAuthorDto, tenantId: string): Promise<Author> {
    const author = await this.authorRepo.findOneBy({ id, tenantId });
    if (!author) throw new NotFoundException('Author not found');
    Object.assign(author, dto);
    return this.authorRepo.save(author);
  }

  async deleteAuthor(id: string, tenantId: string): Promise<void> {
    await this.authorRepo.delete({ id, tenantId });
  }

  // Category CRUD
  async createCategory(dto: CreateCategoryDto, tenantId: string): Promise<Category> {
    const category = this.categoryRepo.create({ ...dto, tenantId });
    return this.categoryRepo.save(category);
  }

  async findAllCategories(tenantId: string): Promise<Category[]> {
    return this.categoryRepo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, tenantId: string): Promise<Category> {
    const category = await this.categoryRepo.findOneBy({ id, tenantId });
    if (!category) throw new NotFoundException('Category not found');
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    await this.categoryRepo.delete({ id, tenantId });
  }

  async createBook(dto: CreateBookDto, tenantId: string, coverPath?: string): Promise<Book> {
    const book = this.bookRepo.create({
      title: dto.title,
      isbn: dto.isbn,
      publisher: dto.publisher,
      publishedDate: dto.publishedDate,
      description: dto.description,
      edition: dto.edition,
      language: dto.language,
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

    const savedBook = await this.bookRepo.save(book);

    // Initial Copies Logic
    if (dto.initialCopies && dto.initialCopies > 0) {
      const copies: BookCopy[] = [];
      let barcodePrefix = '';
      let barcodeNum = 0;
      let barcodePad = 3;

      if (dto.startingBarcode) {
        const match = dto.startingBarcode.match(/^(.*?)(\d+)$/);
        if (match) {
          barcodePrefix = match[1];
          barcodeNum = parseInt(match[2], 10);
          barcodePad = match[2].length;
        } else {
          barcodePrefix = dto.startingBarcode + '-';
          barcodeNum = 1;
        }
      }

      for (let i = 0; i < dto.initialCopies; i++) {
        let barcode = undefined;
        if (dto.startingBarcode) {
          barcode = `${barcodePrefix}${String(barcodeNum + i).padStart(barcodePad, '0')}`;
        }
        
        copies.push(this.copyRepo.create({
          bookId: savedBook.id,
          barcode,
          status: 'available',
          tenantId,
        }));
      }
      await this.copyRepo.save(copies);
    }

    return savedBook;
  }

  async updateBook(id: string, dto: UpdateBookDto, tenantId: string, coverPath?: string): Promise<Book> {
    const book = await this.bookRepo.findOneBy({ id, tenantId });
    if (!book) throw new NotFoundException('Book not found');

    if (dto.title) book.title = dto.title;
    if (dto.isbn) book.isbn = dto.isbn;
    if (dto.publisher) book.publisher = dto.publisher;
    if (dto.publishedDate) book.publishedDate = dto.publishedDate;
    if (dto.description) book.description = dto.description;
    if (dto.edition) book.edition = dto.edition;
    if (dto.language) book.language = dto.language;
    if (coverPath) book.coverPath = coverPath;

    if (dto.authorIds) {
      book.authors = await this.authorRepo.find({ where: { id: In(dto.authorIds), tenantId } });
    }
    if (dto.categoryIds) {
      book.categories = await this.categoryRepo.find({ where: { id: In(dto.categoryIds), tenantId } });
    }

    return this.bookRepo.save(book);
  }

  async deleteBook(id: string, tenantId: string): Promise<void> {
    await this.bookRepo.delete({ id, tenantId });
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

  async findOne(id: string, tenantId: string): Promise<Book> {
    const book = await this.bookRepo.findOne({
      where: { id, tenantId },
      relations: [
        'authors', 
        'categories', 
        'copies', 
        'copies.loans', 
        'copies.loans.student', 
        'copies.loans.staff'
      ],
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async createCopy(bookId: string, tenantId: string, barcode?: string, location?: string): Promise<BookCopy> {
    const book = await this.bookRepo.findOneBy({ id: bookId, tenantId });
    if (!book) throw new NotFoundException('Book not found');

    const copy = this.copyRepo.create({ bookId, barcode, location, tenantId });
    return this.copyRepo.save(copy);
  }

  async updateCopy(id: string, tenantId: string, barcode?: string, location?: string, status?: string): Promise<BookCopy> {
    const copy = await this.copyRepo.findOneBy({ id, tenantId });
    if (!copy) throw new NotFoundException('Copy not found');
    if (barcode !== undefined) copy.barcode = barcode;
    if (location !== undefined) copy.location = location;
    if (status !== undefined) copy.status = status;
    return this.copyRepo.save(copy);
  }

  async deleteCopy(id: string, tenantId: string): Promise<void> {
    await this.copyRepo.delete({ id, tenantId });
  }

  async issueLoan(dto: IssueLoanDto, tenantId: string): Promise<Loan> {
    const copy = await this.copyRepo.findOne({ where: { id: dto.copyId, tenantId } });
    if (!copy) throw new NotFoundException('Copy not found');
    if (copy.status !== 'available') throw new ConflictException('Copy not available');

    const loanData: any = {
      copyId: dto.copyId,
      studentId: dto.studentId,
      staffId: dto.staffId,
      borrowerId: dto.studentId || dto.staffId || dto.borrowerId,
      issuedAt: new Date(),
      dueAt: new Date(dto.dueAt),
      status: 'active',
      tenantId,
    };
    const loan = this.loanRepo.create(loanData as DeepPartial<Loan>);

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
      const settings = await this.settingsRepo.findOne({ where: { tenantId } });
      const graceDays = settings?.graceDays ?? 3;
      const finePerDay = settings?.finePerDay ?? 50;

      const fineAmount = this.calculateFine(loan.dueAt, now, graceDays, finePerDay);
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

  async findOverdues(tenantId: string): Promise<any[]> {
    const now = new Date();
    const loans = await this.loanRepo.find({ 
      where: { tenantId, status: 'active' }, 
      relations: ['copy', 'copy.book'] 
    });

    const settings = await this.settingsRepo.findOne({ where: { tenantId } });
    const graceDays = settings?.graceDays ?? 3;
    const finePerDay = settings?.finePerDay ?? 50;

    return loans.map(loan => {
      const fineAmount = this.calculateFine(loan.dueAt, now, graceDays, finePerDay);
      return { ...loan, fineAmount };
    });
  }

  async findActiveLoanByBarcode(barcode: string, tenantId: string): Promise<any> {
    const copy = await this.copyRepo.findOne({ where: { barcode, tenantId } });
    if (!copy) throw new NotFoundException('Copy not found');

    const loan = await this.loanRepo.findOne({ 
      where: { copyId: copy.id, status: 'active', tenantId },
      relations: ['copy', 'copy.book']
    });

    if (!loan) return null;

    const settings = await this.settingsRepo.findOne({ where: { tenantId } });
    const graceDays = settings?.graceDays ?? 3;
    const finePerDay = settings?.finePerDay ?? 50;
    const fineAmount = this.calculateFine(loan.dueAt, new Date(), graceDays, finePerDay);

    return { ...loan, fineAmount };
  }

  async getStats(tenantId: string) {
    const [totalBooks, totalAuthors, totalCategories, totalLoans, overdueLoans] = await Promise.all([
      this.bookRepo.countBy({ tenantId }),
      this.authorRepo.countBy({ tenantId }),
      this.categoryRepo.countBy({ tenantId }),
      this.loanRepo.countBy({ tenantId, status: 'active' }),
      this.loanRepo.countBy({ tenantId, status: 'active', dueAt: LessThan(new Date()) }),
    ]);

    return {
      totalBooks,
      totalAuthors,
      totalCategories,
      activeLoans: totalLoans,
      overdueLoans,
    };
  }
  async findStudentLoans(studentOrUserId: string, tenantId: string): Promise<any[]> {
    // Try to find the student directly (if the ID is a studentId)
    // Or try to find the student where userId matches
    const loans = await this.loanRepo.find({
      where: [
        { studentId: studentOrUserId, tenantId },
        { student: { userId: studentOrUserId }, tenantId }
      ],
      relations: ['copy', 'copy.book', 'copy.book.authors', 'student'],
      order: { issuedAt: 'DESC' },
    });

    const settings = await this.settingsRepo.findOne({ where: { tenantId } });
    const graceDays = settings?.graceDays ?? 3;
    const finePerDay = settings?.finePerDay ?? 50;
    const now = new Date();

    // Also get fines for this student's loans
    const loanIds = loans.map(l => l.id);
    const fines = loanIds.length > 0 
      ? await this.fineRepo.find({ where: { loanId: In(loanIds), tenantId } })
      : [];

    return loans.map(loan => {
      const fine = fines.find(f => f.loanId === loan.id);
      const currentFine = loan.status === 'active' && loan.dueAt < now
        ? this.calculateFine(loan.dueAt, now, graceDays, finePerDay)
        : 0;

      return {
        ...loan,
        fineAmount: fine?.amount || currentFine,
        finePaid: fine?.paid || false,
      };
    });
  }
  async getSettings(tenantId: string): Promise<LibrarySetting> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!settings) {
      settings = this.settingsRepo.create({
        graceDays: 3,
        finePerDay: 50,
        tenantId,
      });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(tenantId: string, payload: { graceDays?: number; finePerDay?: number }): Promise<LibrarySetting> {
    const settings = await this.getSettings(tenantId);
    if (payload.graceDays !== undefined) settings.graceDays = payload.graceDays;
    if (payload.finePerDay !== undefined) settings.finePerDay = payload.finePerDay;
    return this.settingsRepo.save(settings);
  }
}
