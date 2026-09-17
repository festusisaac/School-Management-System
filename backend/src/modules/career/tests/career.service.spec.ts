import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CareerService } from '../services/career.service';
import { JobPosting } from '../entities/job-posting.entity';
import { NotFoundException } from '@nestjs/common';

describe('CareerService', () => {
  let service: CareerService;

  const mockJobRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareerService,
        { provide: getRepositoryToken(JobPosting), useValue: mockJobRepo },
      ],
    }).compile();

    service = module.get<CareerService>(CareerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a job posting', async () => {
      mockJobRepo.create.mockReturnValue({ id: 'j_1' });
      mockJobRepo.save.mockResolvedValue({ id: 'j_1' });

      const res = await service.create({ title: 'T' } as any, 'tenant_1');
      expect(res.id).toBe('j_1');
    });
  });

  describe('findAll', () => {
    it('should return all jobs', async () => {
      mockJobRepo.find.mockResolvedValueOnce([{ id: 'j_1' }]);
      const res = await service.findAll('tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockJobRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('j_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return job if found', async () => {
      mockJobRepo.findOne.mockResolvedValueOnce({ id: 'j_1' });
      const res = await service.findOne('j_1', 'tenant_1');
      expect(res.id).toBe('j_1');
    });
  });

  describe('update', () => {
    it('should update job', async () => {
      mockJobRepo.findOne.mockResolvedValueOnce({ id: 'j_1' });
      mockJobRepo.save.mockImplementation(e => e);

      const res = await service.update('j_1', { title: 'New' } as any, 'tenant_1');
      expect(res.title).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove job', async () => {
      mockJobRepo.findOne.mockResolvedValueOnce({ id: 'j_1' });
      mockJobRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('j_1', 'tenant_1');
      expect(mockJobRepo.remove).toHaveBeenCalled();
    });
  });

  describe('findPublic', () => {
    it('should return public jobs using provided tenantId', async () => {
      mockJobRepo.find.mockResolvedValueOnce([{ id: 'j_1' }]);
      const res = await service.findPublic('tenant_1');
      expect(res).toHaveLength(1);
      expect(mockJobRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant_1', status: 'Open' } }));
    });

    it('should return public jobs resolving tenantId from first job if none provided', async () => {
      mockJobRepo.findOne.mockResolvedValueOnce({ id: 'j_0', tenantId: 'tenant_0' });
      mockJobRepo.find.mockResolvedValueOnce([{ id: 'j_1' }]);
      const res = await service.findPublic();
      expect(res).toHaveLength(1);
      expect(mockJobRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 'tenant_0', status: 'Open' } }));
    });

    it('should return empty if no tenantId and no jobs exist', async () => {
      mockJobRepo.findOne.mockResolvedValueOnce(null);
      const res = await service.findPublic();
      expect(res).toEqual([]);
    });
  });
});
