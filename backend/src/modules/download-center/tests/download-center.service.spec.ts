import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DownloadCenterService } from '../download-center.service';
import { DownloadResource, DownloadResourceType, DownloadResourceVisibility, DownloadResourceStatus } from '../entities/download-resource.entity';
import { Student } from '../../students/entities/student.entity';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('DownloadCenterService', () => {
  let service: DownloadCenterService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockResourceRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockStudentQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockStudentRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockStudentQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadCenterService,
        { provide: getRepositoryToken(DownloadResource), useValue: mockResourceRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
      ],
    }).compile();

    service = module.get<DownloadCenterService>(DownloadCenterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if neither file nor url is provided', async () => {
      await expect(service.create({ title: 'T', resourceType: DownloadResourceType.SYLLABUS } as any, 'tenant_1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if video has no valid youtube url', async () => {
      await expect(service.create({ title: 'T', resourceType: DownloadResourceType.VIDEO } as any, 'tenant_1')).rejects.toThrow(BadRequestException);
    });

    it('should create resource', async () => {
      mockResourceRepo.save.mockImplementation(e => e);
      const res = await service.create({ title: 'T', resourceType: DownloadResourceType.MATERIAL, externalUrl: 'http://a.com' } as any, 'tenant_1');
      expect(res.title).toBe('T');
    });
  });

  describe('findAll', () => {
    it('should return for admin', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'r_1' }]);
      const res = await service.findAll('tenant_1', {}, { role: 'admin' });
      expect(res).toHaveLength(1);
    });

    it('should return for student with correct scopes', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1', classId: 'cls_1' });
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'r_1' }]);

      const res = await service.findAll('tenant_1', {}, { role: 'student', id: 'st_1' });
      expect(res).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('resource.status = :published', expect.any(Object));
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockResourceRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('r_1', 'tenant_1', { role: 'admin' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if student accesses unauthorized resource', async () => {
      mockResourceRepo.findOne.mockResolvedValueOnce({ id: 'r_1', status: DownloadResourceStatus.PUBLISHED, visibility: DownloadResourceVisibility.ALL, classId: 'cls_2' });
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1', classId: 'cls_1' });

      await expect(service.findOne('r_1', 'tenant_1', { role: 'student', id: 'st_1' })).rejects.toThrow(ForbiddenException);
    });

    it('should return resource if access allowed', async () => {
      mockResourceRepo.findOne.mockResolvedValueOnce({ id: 'r_1', status: DownloadResourceStatus.PUBLISHED, visibility: DownloadResourceVisibility.ALL });
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });

      const res = await service.findOne('r_1', 'tenant_1', { role: 'student', id: 'st_1' });
      expect(res.id).toBe('r_1');
    });
  });

  describe('remove', () => {
    it('should remove resource', async () => {
      mockResourceRepo.findOne.mockResolvedValueOnce({ id: 'r_1' });
      mockResourceRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('r_1', 'tenant_1');
      expect(mockResourceRepo.remove).toHaveBeenCalled();
    });
  });

  describe('incrementView / incrementDownload', () => {
    it('should increment view count', async () => {
      mockResourceRepo.increment.mockResolvedValueOnce(undefined);
      await service.incrementView('r_1', 'tenant_1');
      expect(mockResourceRepo.increment).toHaveBeenCalledWith({ id: 'r_1', tenantId: 'tenant_1' }, 'viewCount', 1);
    });

    it('should increment download count', async () => {
      mockResourceRepo.increment.mockResolvedValueOnce(undefined);
      await service.incrementDownload('r_1', 'tenant_1');
      expect(mockResourceRepo.increment).toHaveBeenCalledWith({ id: 'r_1', tenantId: 'tenant_1' }, 'downloadCount', 1);
    });
  });
});
