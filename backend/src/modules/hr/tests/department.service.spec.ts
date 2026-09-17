import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepartmentService } from '../services/department.service';
import { Department } from '../entities/department.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('DepartmentService', () => {
  let service: DepartmentService;

  const mockDepartmentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        { provide: getRepositoryToken(Department), useValue: mockDepartmentRepository },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of departments', async () => {
      const depts = [{ id: 'dept_1', name: 'Science' }];
      mockDepartmentRepository.find.mockResolvedValueOnce(depts);

      const result = await service.findAll('tenant_1');
      expect(result).toEqual(depts);
      expect(mockDepartmentRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, tenantId: 'tenant_1' },
        relations: ['staff', 'headOfDepartment'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if department is not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid_id', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return a department if found', async () => {
      const dept = { id: 'dept_1', name: 'Science' };
      mockDepartmentRepository.findOne.mockResolvedValueOnce(dept);

      const result = await service.findOne('dept_1', 'tenant_1');
      expect(result).toEqual(dept);
      expect(mockDepartmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'dept_1', tenantId: 'tenant_1' },
        relations: ['staff', 'headOfDepartment'],
      });
    });
  });

  describe('create', () => {
    it('should throw ConflictException if code already exists', async () => {
      mockDepartmentRepository.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.create({ code: 'SCI' }, 'tenant_1')).rejects.toThrow(ConflictException);
    });

    it('should create and return a new department', async () => {
      mockDepartmentRepository.findOne.mockResolvedValueOnce(null); // duplicate check
      mockDepartmentRepository.create.mockReturnValueOnce({ id: 'new_dept' });
      mockDepartmentRepository.save.mockResolvedValueOnce({ id: 'new_dept' });
      
      // We also mock findOne which is called at the end to return the fully joined entity
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'new_dept', name: 'Science' } as any);

      const result = await service.create({ code: 'SCI', headOfDepartmentId: '' } as any, 'tenant_1');
      
      expect(result.id).toBe('new_dept');
      expect(mockDepartmentRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return department', async () => {
      const dept = { id: 'dept_1', code: 'OLD' };
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(dept as any) // initial findOne
        .mockResolvedValueOnce({ ...dept, code: 'NEW' } as any); // final return findOne

      mockDepartmentRepository.findOne.mockResolvedValueOnce(null); // duplicate code check
      mockDepartmentRepository.save.mockImplementationOnce((val) => Promise.resolve(val));

      const result = await service.update('dept_1', { code: 'NEW', headOfDepartmentId: 'staff_1' } as any, 'tenant_1');
      
      expect(mockDepartmentRepository.save).toHaveBeenCalled();
      expect(result.code).toBe('NEW');
    });

    it('should clear headOfDepartment if headOfDepartmentId is empty', async () => {
      const dept = { id: 'dept_1', code: 'OLD', headOfDepartmentId: 'staff_1' };
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(dept as any) // initial findOne
        .mockResolvedValueOnce({ ...dept, headOfDepartmentId: null } as any); // final return findOne

      mockDepartmentRepository.save.mockImplementationOnce((val) => Promise.resolve(val));

      await service.update('dept_1', { headOfDepartmentId: '' } as any, 'tenant_1');
      expect(mockDepartmentRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        headOfDepartment: null,
        headOfDepartmentId: null
      }));
    });

    it('should throw ConflictException if new code already exists', async () => {
      const dept = { id: 'dept_1', code: 'OLD' };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(dept as any);
      
      mockDepartmentRepository.findOne.mockResolvedValueOnce({ id: 'other_dept' }); // duplicate code check

      await expect(service.update('dept_1', { code: 'NEW' }, 'tenant_1')).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should set isActive to false and save', async () => {
      const dept = { id: 'dept_1', isActive: true };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(dept as any);
      mockDepartmentRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      await service.remove('dept_1', 'tenant_1');
      expect(mockDepartmentRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });
  });

  describe('assignHead', () => {
    it('should assign head and save', async () => {
      const dept = { id: 'dept_1' };
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(dept as any)
        .mockResolvedValueOnce({ ...dept, headOfDepartmentId: 'staff_1' } as any);
        
      mockDepartmentRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.assignHead('dept_1', 'staff_1', 'tenant_1');
      expect(mockDepartmentRepository.save).toHaveBeenCalledWith(expect.objectContaining({ headOfDepartmentId: 'staff_1' }));
      expect(result.headOfDepartmentId).toBe('staff_1');
    });
  });
});
