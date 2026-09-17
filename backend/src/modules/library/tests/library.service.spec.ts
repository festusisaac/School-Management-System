import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LibraryService } from '../library.service';
import { Book } from '../entities/book.entity';
import { Author } from '../entities/author.entity';
import { Category } from '../entities/category.entity';
import { BookCopy } from '../entities/book-copy.entity';
import { Loan } from '../entities/loan.entity';
import { Fine } from '../entities/fine.entity';
import { LibrarySetting } from '../entities/library-setting.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('LibraryService', () => {
  let service: LibraryService;

  const createMockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    countBy: jest.fn(),
    manager: { query: jest.fn() },
  });

  const mockBookRepo = createMockRepo();
  const mockAuthorRepo = createMockRepo();
  const mockCategoryRepo = createMockRepo();
  const mockCopyRepo = createMockRepo();
  const mockLoanRepo = createMockRepo();
  const mockFineRepo = createMockRepo();
  const mockSettingsRepo = createMockRepo();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibraryService,
        { provide: getRepositoryToken(Book), useValue: mockBookRepo },
        { provide: getRepositoryToken(Author), useValue: mockAuthorRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(BookCopy), useValue: mockCopyRepo },
        { provide: getRepositoryToken(Loan), useValue: mockLoanRepo },
        { provide: getRepositoryToken(Fine), useValue: mockFineRepo },
        { provide: getRepositoryToken(LibrarySetting), useValue: mockSettingsRepo },
      ],
    }).compile();

    service = module.get<LibraryService>(LibraryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Author CRUD', () => {
    it('createAuthor should save author', async () => {
      mockAuthorRepo.create.mockReturnValue({ id: 'a_1' });
      mockAuthorRepo.save.mockResolvedValue({ id: 'a_1' });
      const res = await service.createAuthor({ name: 'A' }, 't_1');
      expect(res.id).toBe('a_1');
    });

    it('updateAuthor should update author', async () => {
      mockAuthorRepo.findOneBy.mockResolvedValueOnce({ id: 'a_1', name: 'Old' });
      mockAuthorRepo.save.mockImplementation(e => e);
      const res = await service.updateAuthor('a_1', { name: 'New' }, 't_1');
      expect(res.name).toBe('New');
    });
  });

  describe('createBook', () => {
    it('should create book and copies', async () => {
      mockBookRepo.create.mockReturnValue({ id: 'b_1' });
      mockBookRepo.save.mockResolvedValue({ id: 'b_1' });
      mockAuthorRepo.find.mockResolvedValueOnce([{ id: 'a_1' }]);
      mockCopyRepo.create.mockImplementation(dto => dto);
      mockCopyRepo.save.mockResolvedValueOnce([]);

      const res = await service.createBook({ title: 'B', authorIds: ['a_1'], initialCopies: 2, startingBarcode: 'B-1' }, 't_1');
      expect(res.id).toBe('b_1');
      expect(mockCopyRepo.save).toHaveBeenCalled();
    });
  });

  describe('issueLoan', () => {
    it('should throw if copy not found', async () => {
      mockCopyRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.issueLoan({ copyId: 'c_1' } as any, 't_1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if copy not available', async () => {
      mockCopyRepo.findOne.mockResolvedValueOnce({ id: 'c_1', status: 'loaned' });
      await expect(service.issueLoan({ copyId: 'c_1' } as any, 't_1')).rejects.toThrow(ConflictException);
    });

    it('should issue loan and update copy status', async () => {
      mockCopyRepo.findOne.mockResolvedValueOnce({ id: 'c_1', status: 'available' });
      mockLoanRepo.create.mockReturnValue({ id: 'l_1' });
      mockLoanRepo.save.mockResolvedValue({ id: 'l_1' });
      mockCopyRepo.save.mockResolvedValue(undefined);

      const res = await service.issueLoan({ copyId: 'c_1', dueAt: new Date().toISOString() } as any, 't_1');
      expect(res.id).toBe('l_1');
      expect(mockCopyRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'loaned' }));
    });
  });

  describe('returnLoan', () => {
    it('should process return, update copy, and calc fine', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      mockLoanRepo.findOne.mockResolvedValueOnce({ id: 'l_1', copyId: 'c_1', dueAt: pastDate, status: 'active' });
      mockLoanRepo.save.mockImplementation(e => e);
      mockCopyRepo.findOneBy.mockResolvedValueOnce({ id: 'c_1' });
      mockSettingsRepo.findOne.mockResolvedValueOnce({ graceDays: 0, finePerDay: 50 });
      mockFineRepo.create.mockReturnValue({ id: 'f_1' });
      mockFineRepo.save.mockResolvedValue(undefined);

      const res = await service.returnLoan({ loanId: 'l_1' }, 't_1');
      expect(res.status).toBe('returned');
      expect(mockFineRepo.create).toHaveBeenCalled(); // Since it was due 10 days ago
    });
  });

  describe('getStats', () => {
    it('should return library stats', async () => {
      mockBookRepo.countBy.mockResolvedValue(10);
      mockAuthorRepo.countBy.mockResolvedValue(5);
      mockCategoryRepo.countBy.mockResolvedValue(3);
      mockLoanRepo.countBy.mockResolvedValue(2); // Two calls

      const res = await service.getStats('t_1');
      expect(res.totalBooks).toBe(10);
      expect(res.totalAuthors).toBe(5);
    });
  });
});
