import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AcademicsService } from '../services/academics.service';
import { Class } from '../entities/class.entity';
import { Section } from '../entities/section.entity';
import { Subject } from '../entities/subject.entity';
import { SubjectGroup } from '../entities/subject-group.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AcademicsService', () => {
  let service: AcademicsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockManager = {
    query: jest.fn(),
  };

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: mockManager,
  });

  const mockClassRepo = createMockRepository();
  const mockSectionRepo = createMockRepository();
  const mockSubjectRepo = createMockRepository();
  const mockSubjectGroupRepo = createMockRepository();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicsService,
        { provide: getRepositoryToken(Class), useValue: mockClassRepo },
        { provide: getRepositoryToken(Section), useValue: mockSectionRepo },
        { provide: getRepositoryToken(Subject), useValue: mockSubjectRepo },
        { provide: getRepositoryToken(SubjectGroup), useValue: mockSubjectGroupRepo },
      ],
    }).compile();

    service = module.get<AcademicsService>(AcademicsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Classes', () => {
    it('createClass', async () => {
      mockClassRepo.create.mockReturnValueOnce({ name: 'JSS1' });
      mockClassRepo.save.mockResolvedValueOnce({ id: 'c1', name: 'JSS1' });
      const res = await service.createClass({ name: 'JSS1', schoolSectionId: '' });
      expect(res.id).toBe('c1');
      expect(mockClassRepo.create).toHaveBeenCalledWith({ name: 'JSS1', schoolSectionId: null });
    });

    it('getAllClasses', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'c1' }]);
      const res = await service.getAllClasses('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('getClassById', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1' });
      const res = await service.getClassById('c1');
      expect(res.id).toBe('c1');
    });

    it('updateClass', async () => {
      mockClassRepo.update.mockResolvedValueOnce({});
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1', name: 'Updated' });
      const res = await service.updateClass('c1', { name: 'Updated', schoolSectionId: '' });
      expect(res.name).toBe('Updated');
    });

    it('deleteClass - success', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1', sections: [] });
      mockManager.query.mockResolvedValue([{ count: '0' }]);
      await service.deleteClass('c1');
      expect(mockClassRepo.remove).toHaveBeenCalled();
    });

    it('deleteClass - fail due to sections', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1', sections: [{ id: 's1' }] });
      await expect(service.deleteClass('c1')).rejects.toThrow(BadRequestException);
    });

    it('toggleClassStatus', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1', isActive: true });
      mockClassRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      const res = await service.toggleClassStatus('c1');
      expect(res.isActive).toBe(false);
    });
  });

  describe('Sections', () => {
    it('createSection', async () => {
      mockSectionRepo.create.mockReturnValueOnce({ name: 'A' });
      mockSectionRepo.save.mockResolvedValueOnce({ id: 's1' });
      const res = await service.createSection({ name: 'A', classTeacherId: '' });
      expect(res.id).toBe('s1');
      expect(mockSectionRepo.create).toHaveBeenCalledWith({ name: 'A', classTeacherId: null });
    });

    it('getAllSections', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 's1' }]);
      const res = await service.getAllSections('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('deleteSection - success', async () => {
      mockSectionRepo.findOne.mockResolvedValueOnce({ id: 's1' });
      mockManager.query.mockResolvedValue([{ count: '0' }]);
      await service.deleteSection('s1');
      expect(mockSectionRepo.remove).toHaveBeenCalled();
    });
    
    it('updateSection', async () => {
        mockSectionRepo.update.mockResolvedValueOnce({});
        mockSectionRepo.findOne.mockResolvedValueOnce({ id: 's1', name: 'Updated' });
        const res = await service.updateSection('s1', { name: 'Updated', classTeacherId: '' });
        expect(res.name).toBe('Updated');
    });

    it('toggleSectionStatus', async () => {
        mockSectionRepo.findOne.mockResolvedValueOnce({ id: 's1', isActive: true });
        mockSectionRepo.save.mockImplementationOnce(val => Promise.resolve(val));
        const res = await service.toggleSectionStatus('s1');
        expect(res.isActive).toBe(false);
    });
  });

  describe('Subjects', () => {
    it('createSubject', async () => {
      mockSubjectRepo.create.mockReturnValueOnce({ name: 'Math' });
      mockSubjectRepo.save.mockResolvedValueOnce({ id: 'sub1' });
      const res = await service.createSubject({ name: 'Math', groupId: '' });
      expect(res.id).toBe('sub1');
      expect(mockSubjectRepo.create).toHaveBeenCalledWith({ name: 'Math', groupId: null });
    });

    it('getAllSubjects', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'sub1' }]);
      const res = await service.getAllSubjects('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('updateSubject', async () => {
        mockSubjectRepo.update.mockResolvedValueOnce({});
        mockSubjectRepo.findOne.mockResolvedValueOnce({ id: 'sub1', name: 'Updated' });
        const res = await service.updateSubject('sub1', { name: 'Updated', groupId: '' });
        expect(res.name).toBe('Updated');
    });

    it('deleteSubject', async () => {
        mockSubjectRepo.findOne.mockResolvedValueOnce({ id: 'sub1' });
        await service.deleteSubject('sub1');
        expect(mockSubjectRepo.remove).toHaveBeenCalled();
    });

    it('toggleSubjectStatus', async () => {
        mockSubjectRepo.findOne.mockResolvedValueOnce({ id: 'sub1', isActive: true });
        mockSubjectRepo.save.mockImplementationOnce(val => Promise.resolve(val));
        const res = await service.toggleSubjectStatus('sub1');
        expect(res.isActive).toBe(false);
    });
  });

  describe('Subject Groups', () => {
    it('createSubjectGroup', async () => {
      mockSubjectGroupRepo.create.mockReturnValueOnce({ name: 'Science' });
      mockSubjectGroupRepo.save.mockResolvedValueOnce({ id: 'sg1' });
      const res = await service.createSubjectGroup({ name: 'Science' });
      expect(res.id).toBe('sg1');
    });

    it('getAllSubjectGroups', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'sg1' }]);
      const res = await service.getAllSubjectGroups('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('updateSubjectGroup', async () => {
        mockSubjectGroupRepo.update.mockResolvedValueOnce({});
        mockSubjectGroupRepo.findOne.mockResolvedValueOnce({ id: 'sg1', name: 'Updated' });
        const res = await service.updateSubjectGroup('sg1', { name: 'Updated' });
        expect(res.name).toBe('Updated');
    });

    it('deleteSubjectGroup', async () => {
        mockSubjectGroupRepo.findOne.mockResolvedValueOnce({ id: 'sg1', subjects: [] });
        await service.deleteSubjectGroup('sg1');
        expect(mockSubjectGroupRepo.remove).toHaveBeenCalled();
    });

    it('toggleSubjectGroupStatus', async () => {
        mockSubjectGroupRepo.findOne.mockResolvedValueOnce({ id: 'sg1', isActive: true });
        mockSubjectGroupRepo.save.mockImplementationOnce(val => Promise.resolve(val));
        const res = await service.toggleSubjectGroupStatus('sg1');
        expect(res.isActive).toBe(false);
    });
  });

  describe('Class Teacher Assignments', () => {
    it('assignClassTeacher', async () => {
      mockSectionRepo.findOne.mockResolvedValueOnce({ id: 's1' });
      mockSectionRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      const res = await service.assignClassTeacher('s1', 't1');
      expect(res.classTeacherId).toBe('t1');
    });

    it('removeClassTeacher', async () => {
      mockSectionRepo.findOne.mockResolvedValueOnce({ id: 's1' });
      mockSectionRepo.update.mockResolvedValueOnce({});
      mockSectionRepo.findOne.mockResolvedValueOnce({ id: 's1', classTeacherId: null });
      const res = await service.removeClassTeacher('s1');
      expect(res.classTeacherId).toBeNull();
    });

    it('assignClassTeacherDirect', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1' });
      mockClassRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      const res = await service.assignClassTeacherDirect('c1', 't1');
      expect(res.classTeacherId).toBe('t1');
    });

    it('removeClassTeacherDirect', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1' });
      mockClassRepo.update.mockResolvedValueOnce({});
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 'c1', classTeacherId: null });
      const res = await service.removeClassTeacherDirect('c1');
      expect(res.classTeacherId).toBeNull();
    });
  });
});
