import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CbtQuestionService } from '../services/cbt-question.service';
import { CbtQuestion } from '../entities/cbt-question.entity';
import { CbtOption } from '../entities/cbt-option.entity';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('CbtQuestionService', () => {
  let service: CbtQuestionService;

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  });

  const mockQuestionRepo = createMockRepository();
  const mockOptionRepo = createMockRepository();

  const mockManager = {
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CbtQuestionService,
        { provide: getRepositoryToken(CbtQuestion), useValue: mockQuestionRepo },
        { provide: getRepositoryToken(CbtOption), useValue: mockOptionRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CbtQuestionService>(CbtQuestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all questions for an exam', async () => {
      mockQuestionRepo.find.mockResolvedValueOnce([{ id: 'q_1' }]);
      const res = await service.findAll('ex_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockQuestionRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('q_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return question if found', async () => {
      mockQuestionRepo.findOne.mockResolvedValueOnce({ id: 'q_1' });
      const res = await service.findOne('q_1', 'tenant_1');
      expect(res.id).toBe('q_1');
    });
  });

  describe('create', () => {
    it('should create a question with options', async () => {
      mockQuestionRepo.create.mockReturnValue({ id: 'q_1' });
      mockQuestionRepo.save.mockResolvedValue({ id: 'q_1' });
      mockOptionRepo.create.mockReturnValue({});

      const dto = { examId: 'ex_1', content: 'What?', marks: 5, options: [{ content: 'A', isCorrect: true }] };
      const res = await service.create(dto as any, 'tenant_1');

      expect(res.id).toBe('q_1');
      expect(mockQuestionRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update question and replace options', async () => {
      mockQuestionRepo.findOne.mockResolvedValueOnce({ id: 'q_1' });
      
      mockDataSource.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });
      mockManager.save.mockResolvedValueOnce({ id: 'q_1', content: 'New' });

      const res = await service.update('q_1', { content: 'New', options: [{ content: 'B', isCorrect: true }] } as any, 'tenant_1');

      expect(res.content).toBe('New');
      expect(mockManager.delete).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if not found', async () => {
      mockQuestionRepo.delete.mockResolvedValueOnce({ affected: 0 });
      await expect(service.delete('q_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should delete question', async () => {
      mockQuestionRepo.delete.mockResolvedValueOnce({ affected: 1 });
      const res = await service.delete('q_1', 'tenant_1');
      expect(res.success).toBe(true);
    });
  });

  describe('bulkImport', () => {
    it('should import questions successfully and report errors', async () => {
      mockDataSource.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      const data = [
        // Valid
        {
          Question: 'Q1',
          Marks: 5,
          'Correct Answer': 'A',
          'Option A': 'Ans A',
          'Option B': 'Ans B',
        },
        // Invalid (no correct answer option matching)
        {
          Question: 'Q2',
          Marks: 5,
          'Correct Answer': 'C',
          'Option A': 'Ans A',
          'Option B': 'Ans B',
        }
      ];

      mockManager.create.mockImplementation((entity, dto) => ({ ...dto, id: 'mocked_id' }));
      mockManager.save.mockResolvedValue({});

      const res = await service.bulkImport('ex_1', data, 'tenant_1');

      expect(mockManager.delete).toHaveBeenCalledWith(CbtQuestion, { examId: 'ex_1', tenantId: 'tenant_1' });
      expect(res.success).toBe(1);
      expect(res.failed).toBe(1);
      expect(res.errors[0].error).toContain('Correct answer label must match');
    });
  });
});
