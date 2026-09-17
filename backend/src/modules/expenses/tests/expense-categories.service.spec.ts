import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseCategoriesService } from '../services/expense-categories.service';
import { ExpenseCategory } from '../entities/expense-category.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ExpenseCategoriesService', () => {
  let service: ExpenseCategoriesService;

  const mockCategoryRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseCategoriesService,
        { provide: getRepositoryToken(ExpenseCategory), useValue: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<ExpenseCategoriesService>(ExpenseCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories for tenant', async () => {
      mockCategoryRepo.find.mockResolvedValueOnce([{ id: 'c_1' }]);
      const res = await service.findAll('tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('c_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return category if found', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'c_1' });
      const res = await service.findOne('c_1', 'tenant_1');
      expect(res.id).toBe('c_1');
    });
  });

  describe('create', () => {
    it('should throw ConflictException if category exists', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'c_1' });
      await expect(service.create({ name: 'Books', description: '' }, 'tenant_1'))
        .rejects.toThrow(ConflictException);
    });

    it('should create and return category', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce(null);
      mockCategoryRepo.create.mockReturnValue({ id: 'c_1' });
      mockCategoryRepo.save.mockResolvedValue({ id: 'c_1', name: 'Books' });

      const res = await service.create({ name: 'Books', description: '' }, 'tenant_1');
      expect(res.id).toBe('c_1');
    });
  });

  describe('update', () => {
    it('should throw ConflictException if new name conflicts', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'c_1', name: 'Old' }); // For findOne
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'c_2' }); // For existing name check
      
      await expect(service.update('c_1', { name: 'Books' }, 'tenant_1'))
        .rejects.toThrow(ConflictException);
    });

    it('should update category', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'c_1', name: 'Old' });
      mockCategoryRepo.findOne.mockResolvedValueOnce(null); // No conflict
      mockCategoryRepo.save.mockResolvedValue({ id: 'c_1', name: 'Books' });

      const res = await service.update('c_1', { name: 'Books' }, 'tenant_1');
      expect(res.name).toBe('Books');
    });
  });

  describe('remove', () => {
    it('should soft delete category by setting isActive false', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'c_1', isActive: true });
      mockCategoryRepo.save.mockResolvedValue({ id: 'c_1', isActive: false });

      const res = await service.remove('c_1', 'tenant_1');
      expect(res.isActive).toBe(false);
    });
  });
});
