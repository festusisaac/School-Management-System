import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchoolSectionService } from '../services/school-section.service';
import { SchoolSection } from '../entities/school-section.entity';
import { NotFoundException } from '@nestjs/common';

describe('SchoolSectionService', () => {
  let service: SchoolSectionService;

  const mockSchoolSectionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolSectionService,
        { provide: getRepositoryToken(SchoolSection), useValue: mockSchoolSectionRepository },
      ],
    }).compile();

    service = module.get<SchoolSectionService>(SchoolSectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of school sections', async () => {
      mockSchoolSectionRepository.find.mockResolvedValueOnce([{ id: 'sec_1' }]);
      const result = await service.findAll('tenant_1');
      expect(result).toHaveLength(1);
      expect(mockSchoolSectionRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant_1' },
        relations: ['classes'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockSchoolSectionRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return a section if found', async () => {
      mockSchoolSectionRepository.findOne.mockResolvedValueOnce({ id: 'sec_1' });
      const result = await service.findOne('sec_1', 'tenant_1');
      expect(result.id).toBe('sec_1');
    });
  });

  describe('create', () => {
    it('should create and save a new section', async () => {
      mockSchoolSectionRepository.create.mockReturnValueOnce({ name: 'Primary' });
      mockSchoolSectionRepository.save.mockResolvedValueOnce({ id: 'sec_1', name: 'Primary' });

      const result = await service.create({ name: 'Primary' }, 'tenant_1');
      expect(result.id).toBe('sec_1');
      expect(mockSchoolSectionRepository.create).toHaveBeenCalledWith({ name: 'Primary', tenantId: 'tenant_1' });
    });
  });

  describe('update', () => {
    it('should update and return the section', async () => {
      mockSchoolSectionRepository.update.mockResolvedValueOnce({});
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'sec_1', name: 'Updated' } as any);

      const result = await service.update('sec_1', { name: 'Updated' }, 'tenant_1');
      expect(result.name).toBe('Updated');
      expect(mockSchoolSectionRepository.update).toHaveBeenCalledWith({ id: 'sec_1', tenantId: 'tenant_1' }, { name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('should throw an error if section has classes', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'sec_1', classes: [{ id: 'class_1' }] } as any);
      await expect(service.delete('sec_1', 'tenant_1')).rejects.toThrow('Cannot delete section with existing classes');
    });

    it('should remove the section if no classes', async () => {
      const section = { id: 'sec_1', classes: [] };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(section as any);
      mockSchoolSectionRepository.remove.mockResolvedValueOnce({});

      await service.delete('sec_1', 'tenant_1');
      expect(mockSchoolSectionRepository.remove).toHaveBeenCalledWith(section);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle isActive status', async () => {
      const section = { id: 'sec_1', isActive: true };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(section as any);
      mockSchoolSectionRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.toggleStatus('sec_1', 'tenant_1');
      expect(result.isActive).toBe(false);
    });
  });
});
