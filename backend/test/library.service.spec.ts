import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LibraryService } from '../src/modules/library/library.service';
import { Book } from '../src/modules/library/entities/book.entity';
import { Author } from '../src/modules/library/entities/author.entity';
import { Category } from '../src/modules/library/entities/category.entity';
import { BookCopy } from '../src/modules/library/entities/book-copy.entity';
import { Loan } from '../src/modules/library/entities/loan.entity';
import { Fine } from '../src/modules/library/entities/fine.entity';
import { LibrarySetting } from '../src/modules/library/entities/library-setting.entity';

describe('LibraryService (unit with mocks)', () => {
  let service: LibraryService;

  const createMockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const mockBookRepo = createMockRepo();
  const mockAuthorRepo = createMockRepo();
  const mockCategoryRepo = createMockRepo();
  const mockBookCopyRepo = createMockRepo();
  const mockLoanRepo = createMockRepo();
  const mockFineRepo = createMockRepo();
  const mockLibrarySettingRepo = createMockRepo();

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LibraryService,
        { provide: getRepositoryToken(Book), useValue: mockBookRepo },
        { provide: getRepositoryToken(Author), useValue: mockAuthorRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(BookCopy), useValue: mockBookCopyRepo },
        { provide: getRepositoryToken(Loan), useValue: mockLoanRepo },
        { provide: getRepositoryToken(Fine), useValue: mockFineRepo },
        { provide: getRepositoryToken(LibrarySetting), useValue: mockLibrarySettingRepo },
      ],
    }).compile();

    service = moduleRef.get<LibraryService>(LibraryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates book and verifies it was saved', async () => {
    mockBookRepo.create.mockReturnValue({ id: 'book_1', title: 'Test Book' });
    mockBookRepo.save.mockResolvedValue({ id: 'book_1', title: 'Test Book' });
    
    // We mock authors and categories just in case
    mockAuthorRepo.findOne.mockResolvedValue({ id: 'auth_1' });
    mockCategoryRepo.findOne.mockResolvedValue({ id: 'cat_1' });

    const book = await service.createBook({ title: 'Test Book' } as any, 'tenant-1');
    expect(book.id).toBe('book_1');
    expect(mockBookRepo.save).toHaveBeenCalled();
  });

  it('creates copy and verifies it was saved', async () => {
    mockBookRepo.findOneBy.mockResolvedValue({ id: 'book_1' });
    mockBookCopyRepo.create.mockReturnValue({ id: 'copy_1', barcode: 'BCODE1' });
    mockBookCopyRepo.save.mockResolvedValue({ id: 'copy_1', barcode: 'BCODE1' });

    const copy = await service.createCopy('book_1', 'tenant-1', 'BCODE1', 'Shelf A');
    expect(copy.id).toBe('copy_1');
    expect(mockBookCopyRepo.save).toHaveBeenCalled();
  });
});
