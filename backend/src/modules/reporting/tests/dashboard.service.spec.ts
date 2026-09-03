import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from '../services/dashboard.service';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { Transaction, TransactionType } from '../../finance/entities/transaction.entity';
import { Class } from '../../academics/entities/class.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { FeeAssignment } from '../../finance/entities/fee-assignment.entity';
import { ExamResult } from '../../examination/entities/exam-result.entity';
import { ExamGroup } from '../../examination/entities/exam-group.entity';
import { StaffAttendance } from '../../hr/entities/staff-attendance.entity';
import { Payroll } from '../../hr/entities/payroll.entity';
import { StudentAttendance } from '../../students/entities/student-attendance.entity';
import { StudentTermResult } from '../../examination/entities/student-term-result.entity';
import { CarryForward } from '../../finance/entities/carry-forward.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';
import { FeesService } from '../../finance/services/fees.service';

describe('DashboardService', () => {
    let service: DashboardService;

    const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
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

    const mockFeesService = {
        getLiveOutstandingSnapshot: jest.fn().mockResolvedValue({ totalOutstanding: 100 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
                { provide: getRepositoryToken(Staff), useValue: mockStaffRepo },
                { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
                { provide: getRepositoryToken(Class), useValue: {} },
                { provide: getRepositoryToken(Subject), useValue: {} },
                { provide: getRepositoryToken(FeeAssignment), useValue: {} },
                { provide: getRepositoryToken(ExamResult), useValue: {} },
                { provide: getRepositoryToken(ExamGroup), useValue: {} },
                { provide: getRepositoryToken(StaffAttendance), useValue: {} },
                { provide: getRepositoryToken(Payroll), useValue: {} },
                { provide: getRepositoryToken(StudentAttendance), useValue: {} },
                { provide: getRepositoryToken(StudentTermResult), useValue: {} },
                { provide: getRepositoryToken(CarryForward), useValue: {} },
                { provide: getRepositoryToken(AcademicSession), useValue: {} },
                { provide: FeesService, useValue: mockFeesService },
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

        const result = await service.getAdminStats('mock-tenant-id');

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
