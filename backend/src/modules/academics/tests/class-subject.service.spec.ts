import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassSubjectService } from '../services/class-subject.service';
import { ClassSubject } from '../entities/class-subject.entity';
import { Class } from '../entities/class.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { IsNull } from 'typeorm';

describe('ClassSubjectService', () => {
  let service: ClassSubjectService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockClassSubjectRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockClassRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassSubjectService,
        { provide: getRepositoryToken(ClassSubject), useValue: mockClassSubjectRepository },
        { provide: getRepositoryToken(Class), useValue: mockClassRepository },
      ],
    }).compile();

    service = module.get<ClassSubjectService>(ClassSubjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByClass', () => {
    it('should return class subjects without section or teacher', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'cs_1' }]);
      const result = await service.findByClass('class_1', 'tenant_1');
      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('cs.classId = :classId', { classId: 'class_1' });
    });

    it('should return class subjects with section', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'cs_1' }]);
      await service.findByClass('class_1', 'tenant_1', 'sec_1');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(cs.sectionId = :sectionId OR cs.sectionId IS NULL)', { sectionId: 'sec_1' });
    });

    it('should return class subjects with teacher', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'cs_1' }]);
      await service.findByClass('class_1', 'tenant_1', undefined, 'teacher_1');
      // SubQuery is used, hard to mock exactly, but we can verify it was called
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockClassSubjectRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return class subject if found', async () => {
      mockClassSubjectRepository.findOne.mockResolvedValueOnce({ id: 'cs_1' });
      const result = await service.findOne('cs_1', 'tenant_1');
      expect(result.id).toBe('cs_1');
    });
  });

  describe('create', () => {
    it('should fetch tenantId from class if not provided', async () => {
      mockClassRepository.findOne.mockResolvedValueOnce({ id: 'class_1', tenantId: 'tenant_from_class' });
      mockClassSubjectRepository.findOne.mockResolvedValueOnce(null); // existing check
      mockClassSubjectRepository.create.mockReturnValueOnce({ id: 'cs_1' });
      mockClassSubjectRepository.save.mockResolvedValueOnce({ id: 'cs_1' });
      
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'cs_1' } as any);

      await service.create({ classId: 'class_1' } as any, '');
      expect(mockClassSubjectRepository.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant_from_class' }));
    });

    it('should throw BadRequestException if tenantId missing and class not found', async () => {
      mockClassRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.create({ classId: 'class_1' } as any, '')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if subject already assigned', async () => {
      mockClassSubjectRepository.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.create({ classId: 'class_1' } as any, 'tenant_1')).rejects.toThrow(ConflictException);
    });
  });

  describe('bulkAssign', () => {
    it('should assign multiple subjects', async () => {
      mockClassSubjectRepository.findOne
        .mockResolvedValueOnce(null) // first subj not existing
        .mockResolvedValueOnce({ id: 'existing' }); // second subj exists

      mockClassSubjectRepository.create.mockReturnValueOnce({ id: 'cs_1' });
      mockClassSubjectRepository.save.mockResolvedValueOnce({ id: 'cs_1' });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'cs_1' } as any);

      const result = await service.bulkAssign({ classId: 'class_1', subjectIds: ['sub_1', 'sub_2'] }, 'tenant_1');
      
      // Should only create for the non-existing one
      expect(result).toHaveLength(1);
      expect(mockClassSubjectRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should fetch tenantId from class if not provided', async () => {
      mockClassRepository.findOne.mockResolvedValueOnce({ id: 'class_1', tenantId: 'tenant_from_class' });
      mockClassSubjectRepository.findOne.mockResolvedValueOnce(null);
      mockClassSubjectRepository.create.mockReturnValueOnce({ id: 'cs_1' });
      mockClassSubjectRepository.save.mockResolvedValueOnce({ id: 'cs_1' });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'cs_1' } as any);

      await service.bulkAssign({ classId: 'class_1', subjectIds: ['sub_1'] }, '');
      expect(mockClassSubjectRepository.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant_from_class' }));
    });
  });

  describe('update', () => {
    it('should update and return', async () => {
      mockClassSubjectRepository.update.mockResolvedValueOnce({});
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'cs_1', isCore: false } as any);

      const result = await service.update('cs_1', { isCore: false }, 'tenant_1');
      expect(result.isCore).toBe(false);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle status and return', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'cs_1', isActive: true } as any)
                                    .mockResolvedValueOnce({ id: 'cs_1', isActive: false } as any);
      mockClassSubjectRepository.save.mockResolvedValueOnce({});

      const result = await service.toggleStatus('cs_1', 'tenant_1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove', async () => {
      const cs = { id: 'cs_1' };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(cs as any);
      
      await service.delete('cs_1', 'tenant_1');
      expect(mockClassSubjectRepository.remove).toHaveBeenCalledWith(cs);
    });
  });

  describe('replicateForNewSession', () => {
    it('should copy old assignments to new session', async () => {
      mockClassSubjectRepository.find.mockResolvedValueOnce([
        { classId: 'class_1', subjectId: 'subj_1' }
      ]);
      
      mockClassSubjectRepository.findOne.mockResolvedValueOnce(null); // not exists yet
      mockClassSubjectRepository.create.mockReturnValueOnce({ id: 'new_cs_1' });
      mockClassSubjectRepository.save.mockResolvedValueOnce({ id: 'new_cs_1' });

      await service.replicateForNewSession('old_session', 'new_session', 'tenant_1');

      expect(mockClassSubjectRepository.find).toHaveBeenCalledWith({ where: { sessionId: 'old_session', tenantId: 'tenant_1' }});
      expect(mockClassSubjectRepository.create).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'new_session' }));
      expect(mockClassSubjectRepository.save).toHaveBeenCalled();
    });

    it('should skip if assignment already exists in new session', async () => {
      mockClassSubjectRepository.find.mockResolvedValueOnce([
        { classId: 'class_1', subjectId: 'subj_1' }
      ]);
      
      mockClassSubjectRepository.findOne.mockResolvedValueOnce({ id: 'existing' });

      await service.replicateForNewSession('old_session', 'new_session', 'tenant_1');

      expect(mockClassSubjectRepository.create).not.toHaveBeenCalled();
      expect(mockClassSubjectRepository.save).not.toHaveBeenCalled();
    });
  });
});
