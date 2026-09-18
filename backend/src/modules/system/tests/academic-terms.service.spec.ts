import { Test, TestingModule } from '@nestjs/testing';
import { AcademicTermsService } from '../services/academic-terms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AcademicTerm } from '../entities/academic-term.entity';
import { AcademicSession } from '../entities/academic-session.entity';
import { SystemSettingsService } from '../services/system-settings.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

const mockTermRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockSessionRepository = {
  findOne: jest.fn(),
};

const mockSystemSettingsService = {
  updateSettings: jest.fn(),
};

describe('AcademicTermsService', () => {
  let service: AcademicTermsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicTermsService,
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: mockTermRepository,
        },
        {
          provide: getRepositoryToken(AcademicSession),
          useValue: mockSessionRepository,
        },
        {
          provide: SystemSettingsService,
          useValue: mockSystemSettingsService,
        },
      ],
    }).compile();

    service = module.get<AcademicTermsService>(AcademicTermsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all terms', async () => {
      mockTermRepository.find.mockResolvedValue([{ id: 'term_1' }]);
      const res = await service.findAll();
      expect(res).toEqual([{ id: 'term_1' }]);
    });
  });

  describe('findAllBySession', () => {
    it('should return terms by session', async () => {
      mockTermRepository.find.mockResolvedValue([{ id: 'term_1' }]);
      const res = await service.findAllBySession('sess_1');
      expect(res).toEqual([{ id: 'term_1' }]);
    });
  });

  describe('findOne', () => {
    it('should return a term', async () => {
      mockTermRepository.findOne.mockResolvedValue({ id: 'term_1' });
      const res = await service.findOne('term_1');
      expect(res).toEqual({ id: 'term_1' });
    });

    it('should throw NotFoundException if not found', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('term_1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const session = { id: 'sess_1', startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31') };

    it('should throw BadRequestException if dates are missing', async () => {
      await expect(service.create({ name: 'Term 1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);
      const dto = { name: 'Term 1', sessionId: 'sess_1', startDate: new Date('2023-02-01'), endDate: new Date('2023-04-01') } as any;
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if term is out of session bounds', async () => {
      mockSessionRepository.findOne.mockResolvedValue(session);
      const dto = { name: 'Term 1', sessionId: 'sess_1', startDate: new Date('2022-01-01'), endDate: new Date('2023-04-01') } as any;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if term start is after end', async () => {
      mockSessionRepository.findOne.mockResolvedValue(session);
      const dto = { name: 'Term 1', sessionId: 'sess_1', startDate: new Date('2023-05-01'), endDate: new Date('2023-04-01') } as any;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on overlap', async () => {
      mockSessionRepository.findOne.mockResolvedValue(session);
      mockQueryBuilder.getOne.mockResolvedValue({ name: 'Overlap' });
      const dto = { name: 'Term 1', sessionId: 'sess_1', startDate: new Date('2023-02-01'), endDate: new Date('2023-04-01') } as any;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should create a term successfully', async () => {
      mockSessionRepository.findOne.mockResolvedValue(session);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      const dto = { name: 'Term 1', sessionId: 'sess_1', startDate: new Date('2023-02-01'), endDate: new Date('2023-04-01'), isActive: true } as any;
      mockTermRepository.create.mockReturnValue({ ...dto, id: 'term_1' });
      mockTermRepository.save.mockResolvedValue({ ...dto, id: 'term_1' });
      
      const res = await service.create(dto);
      expect(res.id).toBe('term_1');
      expect(mockSystemSettingsService.updateSettings).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const session = { id: 'sess_1', startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31') };

    it('should update a term successfully', async () => {
      const term = { id: 'term_1', startDate: new Date('2023-02-01'), endDate: new Date('2023-04-01'), sessionId: 'sess_1', isActive: true };
      mockTermRepository.findOne.mockResolvedValue(term);
      mockSessionRepository.findOne.mockResolvedValue(session);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockTermRepository.save.mockResolvedValue({ ...term, name: 'Updated' });
      
      const res = await service.update('term_1', { name: 'Updated' } as any);
      expect(res.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a term', async () => {
      mockTermRepository.findOne.mockResolvedValue({ id: 'term_1' });
      await service.remove('term_1');
      expect(mockTermRepository.remove).toHaveBeenCalled();
    });
  });
});
