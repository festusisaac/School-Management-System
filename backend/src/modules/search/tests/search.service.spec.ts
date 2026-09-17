import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from '../services/search.service';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';

describe('SearchService', () => {
  let service: SearchService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockStudentRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockStaffRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepo },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('globalSearch', () => {
    it('should return empty if query is too short', async () => {
      const res = await service.globalSearch('a', 'tenant_1', 'admin');
      expect(res.students).toEqual([]);
      expect(res.staff).toEqual([]);
      expect(res.modules).toEqual([]);
    });

    it('should return results for admin', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'st_1', firstName: 'John' }]);
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'stf_1', firstName: 'Jane' }]);

      const res = await service.globalSearch('Directory', 'tenant_1', 'admin');
      expect(res.students).toHaveLength(1);
      expect(res.staff).toHaveLength(1);
      expect(res.modules.length).toBeGreaterThan(0);
    });

    it('should not search students or staff for parents', async () => {
      const res = await service.globalSearch('John', 'tenant_1', 'parent');
      expect(res.students).toHaveLength(0);
      expect(res.staff).toHaveLength(0);
      expect(mockStudentRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
