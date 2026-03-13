import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from '../services/dashboard.service';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { Transaction, TransactionType } from '../../finance/entities/transaction.entity';

describe('DashboardService', () => {
    let service: DashboardService;

    const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
    };

    const mockStudentRepo = {
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        find: jest.fn(),
    };

    const mockStaffRepo = {
        count: jest.fn(),
    };

    const mockTransactionRepo = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
                { provide: getRepositoryToken(Staff), useValue: mockStaffRepo },
                { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
        jest.clearAllMocks();
    });

    it('should return admin stats correctly', async () => {
        mockStudentRepo.count.mockResolvedValueOnce(100); // total
        mockStudentRepo.count.mockResolvedValueOnce(80);  // active

        mockStaffRepo.count.mockResolvedValueOnce(20);    // total
        mockStaffRepo.count.mockResolvedValueOnce(15);    // teaching

        mockQueryBuilder.getRawOne.mockResolvedValueOnce({ total: '50000' });

        const result = await service.getAdminStats();

        expect(result.students.total).toBe(100);
        expect(result.students.active).toBe(80);
        expect(result.students.inactive).toBe(20);
        expect(result.staff.total).toBe(20);
        expect(result.staff.teaching).toBe(15);
        expect(result.finance.totalRevenue).toBe(50000);
        expect(result.feesOverview).toBeDefined();
        expect(result.feesOverview.unpaid).toBe(88);
        expect(result.academicHealth).toBeDefined();
        expect(result.academicHealth.teachersYetToSubmit).toBe(3);
        expect(result.academicHealth.topPerformingSubject).toBe('Mathematics');
        expect(result.studentPerformance).toBeDefined();
        expect(result.studentPerformance.schoolWideAverage).toBe(68.5);
        expect(result.accounting).toBeDefined();
        expect(result.accounting.netBalance).toBe(1250000);
    });
});
