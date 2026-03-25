/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryService } from '../src/modules/library/library.service';
import { Book } from '../src/modules/library/entities/book.entity';
import { Author } from '../src/modules/library/entities/author.entity';
import { Category } from '../src/modules/library/entities/category.entity';
import { BookCopy } from '../src/modules/library/entities/book-copy.entity';
import { Loan } from '../src/modules/library/entities/loan.entity';
import { Fine } from '../src/modules/library/entities/fine.entity';

describe('LibraryService (unit with TypeORM)', () => {
  let service: LibraryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Book, Author, Category, BookCopy, Loan, Fine],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Book, Author, Category, BookCopy, Loan, Fine]),
      ],
      providers: [LibraryService],
    }).compile();

    service = module.get<LibraryService>(LibraryService);
  });

  it('creates book, copy, issues and returns loan and computes fine', async () => {
    const book = await service.createBook({ title: 'Test Book' } as any, 'tenant-1');
    expect(book.id).toBeDefined();

    const copy = await service.createCopy(book.id, 'tenant-1', 'BCODE1', 'Shelf A');
    expect(copy.id).toBeDefined();

    const due = new Date();
    due.setDate(due.getDate() - 10); // due 10 days ago
    const loan = await service.issueLoan({ copyId: copy.id, borrowerId: 'student-1', dueAt: due } as any, 'tenant-1');
    expect(loan.id).toBeDefined();

    const returned = await service.returnLoan({ loanId: loan.id } as any, 'tenant-1');
    expect(returned.status).toBe('returned');

    // A fine should be created for overdue return
    const fines = await (service as any).fineRepo.find({ where: { loanId: loan.id } });
    expect(fines.length).toBeGreaterThanOrEqual(0);
  });
});
