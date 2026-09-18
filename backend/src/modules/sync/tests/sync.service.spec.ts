import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncService } from '../sync.service';
import { Student } from '../../students/entities/student.entity';
import { Transaction } from '../../finance/entities/transaction.entity';
import { StudentAttendance } from '../../students/entities/student-attendance.entity';
import { Class } from '../../academics/entities/class.entity';
import { Section } from '../../academics/entities/section.entity';
import { CommunicationLog } from '../../communication/entities/communication-log.entity';
import { StudentDocument } from '../../students/entities/student-document.entity';
import { StudentTermResult } from '../../examination/entities/student-term-result.entity';
import { ExamGroup } from '../../examination/entities/exam-group.entity';
import { FeeAssignment } from '../../finance/entities/fee-assignment.entity';
import { DiscountProfile } from '../../finance/entities/discount-profile.entity';
import { SystemSetting } from '../../system/entities/system-setting.entity';
import { FeeGroup } from '../../finance/entities/fee-group.entity';
import { FeeHead } from '../../finance/entities/fee-head.entity';
import { CarryForward } from '../../finance/entities/carry-forward.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { StudentsService } from '../../students/services/students.service';
import { FeesService } from '../../finance/services/fees.service';

describe('SyncService', () => {
  let service: SyncService;
  let moduleRef: TestingModule;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const createMockRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  });

  const mockStudentsService = {
    getNextAdmissionNumber: jest.fn().mockResolvedValue({ admissionNo: 'A1' }),
    provisionNewStudentCreatedOffline: jest.fn(),
  };

  const mockFeesService = {
    assignFeesToStudent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getRepositoryToken(Student), useValue: createMockRepo() },
        { provide: getRepositoryToken(Transaction), useValue: createMockRepo() },
        { provide: getRepositoryToken(StudentAttendance), useValue: createMockRepo() },
        { provide: getRepositoryToken(Class), useValue: createMockRepo() },
        { provide: getRepositoryToken(Section), useValue: createMockRepo() },
        { provide: getRepositoryToken(CommunicationLog), useValue: createMockRepo() },
        { provide: getRepositoryToken(StudentDocument), useValue: createMockRepo() },
        { provide: getRepositoryToken(StudentTermResult), useValue: createMockRepo() },
        { provide: getRepositoryToken(ExamGroup), useValue: createMockRepo() },
        { provide: getRepositoryToken(FeeAssignment), useValue: createMockRepo() },
        { provide: getRepositoryToken(DiscountProfile), useValue: createMockRepo() },
        { provide: getRepositoryToken(SystemSetting), useValue: createMockRepo() },
        { provide: getRepositoryToken(FeeGroup), useValue: createMockRepo() },
        { provide: getRepositoryToken(FeeHead), useValue: createMockRepo() },
        { provide: getRepositoryToken(CarryForward), useValue: createMockRepo() },
        { provide: getRepositoryToken(Expense), useValue: createMockRepo() },
        { provide: StudentsService, useValue: mockStudentsService },
        { provide: FeesService, useValue: mockFeesService },
      ],
    }).compile();

    moduleRef = module;

    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPullChanges', () => {
    it('should return changes payload', async () => {
      const res = await service.getPullChanges(new Date(), 'tenant_1');
      expect(res.changes).toBeDefined();
      expect(res.changes.students).toBeDefined();
      expect(res.changes.fee_records).toBeDefined();
    });

    it('should return changes payload with mapped data', async () => {
      const mockFeeAssignRepo = moduleRef.get(getRepositoryToken(FeeAssignment));
      const mockQb = mockFeeAssignRepo.createQueryBuilder();
      mockQb.getMany.mockResolvedValue([
         { id: 'fa1', studentId: 'st_1', feeGroup: { heads: [{ id: 'h1', defaultAmount: '100' }] } }
      ]);

      const mockExpenseRepo = moduleRef.get(getRepositoryToken(Expense));
      mockExpenseRepo.find.mockResolvedValue([
         { id: 'ex1', amount: '50', createdAt: new Date() }
      ]);

      const mockStudentRepo = moduleRef.get(getRepositoryToken(Student));
      mockStudentRepo.find.mockResolvedValue([
         { id: 'st_1', createdAt: new Date(), discountProfileId: 'dp1' },
         { id: 'st_2', deletedAt: new Date() }
      ]);

      const mockDiscountRepo = moduleRef.get(getRepositoryToken(DiscountProfile));
      mockDiscountRepo.find.mockResolvedValue([
        { id: 'dp1', isActive: true, rules: [{ feeHeadId: 'h1', percentage: '10' }, { feeHeadId: 'h2', fixedAmount: '20' }] }
      ]);

      const mockTxRepo = moduleRef.get(getRepositoryToken(Transaction));
      mockTxRepo.find.mockResolvedValue([
         { id: 'tx1', createdAt: new Date() }
      ]);

      const mockAttendanceRepo = moduleRef.get(getRepositoryToken(StudentAttendance));
      mockAttendanceRepo.find.mockResolvedValue([{ id: 'att1', createdAt: new Date() }]);

      const mockClassRepo = moduleRef.get(getRepositoryToken(Class));
      mockClassRepo.find.mockResolvedValue([{ id: 'c1', createdAt: new Date() }]);

      const mockSectionRepo = moduleRef.get(getRepositoryToken(Section));
      mockSectionRepo.find.mockResolvedValue([{ id: 'sec1', createdAt: new Date() }]);

      const mockCommRepo = moduleRef.get(getRepositoryToken(CommunicationLog));
      mockCommRepo.find.mockResolvedValue([{ id: 'comm1', createdAt: new Date() }]);

      const res = await service.getPullChanges(new Date(0), 'tenant_1');
      expect(res.changes.fee_records.created.length).toBeGreaterThan(0);
      expect(res.changes.students.created.length).toBe(1);
      expect(res.changes.students.deleted.length).toBe(1);
      expect(res.changes.attendance.created.length).toBe(1);
      expect(res.changes.classes.created.length).toBe(1);
      expect(res.changes.sections.created.length).toBe(1);
      expect(res.changes.communication_logs.created.length).toBe(1);
    });
  });

  describe('getPullAllChanges', () => {
    it('should return all changes payload', async () => {
      const res = await service.getPullAllChanges('tenant_1');
      expect(res.changes).toBeDefined();
      expect(res.changes.students).toBeDefined();
      expect(res.changes.fee_records).toBeDefined();
    });

    it('should return all mapped data', async () => {
      const mockFeeAssignRepo = moduleRef.get(getRepositoryToken(FeeAssignment));
      mockFeeAssignRepo.find.mockResolvedValue([
         { id: 'fa1', studentId: 'st_1', feeGroup: { heads: [{ id: 'h1', defaultAmount: '100' }] } }
      ]);

      const mockStudentRepo = moduleRef.get(getRepositoryToken(Student));
      mockStudentRepo.find.mockResolvedValue([
         { id: 'st_1', createdAt: new Date() }
      ]);

      const res = await service.getPullAllChanges('tenant_1');
      expect(res.changes.students.updated.length).toBe(1);
      expect(res.changes.fee_records.updated.length).toBeGreaterThan(0);
    });
  });

  describe('pushChanges', () => {
    it('should process push changes without errors', async () => {
      await expect(service.pushChanges({}, 'tenant_1')).resolves.not.toThrow();
    });

    it('should process created and updated students', async () => {
      const changes = {
        students: {
          created: [
            { id: '123e4567-e89b-12d3-a456-426614174000', admissionNo: 'A2', hasDisability: 1, selectedFeeGroups: '["fg_1"]' }
          ],
          updated: [
            { id: '223e4567-e89b-12d3-a456-426614174001', isActive: 0 }
          ],
          deleted: ['323e4567-e89b-12d3-a456-426614174002']
        }
      };
      
      const mockStudentRepo = moduleRef.get(getRepositoryToken(Student));
      mockStudentRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: '223e4567-e89b-12d3-a456-426614174001' });
      mockStudentRepo.save.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });

      await service.pushChanges(changes, 'tenant_1');
      expect(mockStudentRepo.save).toHaveBeenCalledTimes(2);
      expect(mockStudentRepo.softDelete).toHaveBeenCalledTimes(1);
      expect(mockStudentsService.provisionNewStudentCreatedOffline).toHaveBeenCalled();
    });

    it('should process fee records and build allocations', async () => {
      const changes = {
        fee_records: {
          created: [{ id: '123e4567-e89b-12d3-a456-426614174000', amount: '100', studentId: 'st_1' }],
          updated: [{ id: '223e4567-e89b-12d3-a456-426614174001', sessionId: 'ses_1' }],
          deleted: ['323e4567-e89b-12d3-a456-426614174002']
        }
      };
      const mockTxRepo = moduleRef.get(getRepositoryToken(Transaction));
      mockTxRepo.findOne.mockResolvedValue({ id: '223e4567-e89b-12d3-a456-426614174001', sessionId: null });
      
      const mockFeeAssignRepo = moduleRef.get(getRepositoryToken(FeeAssignment));
      mockFeeAssignRepo.find.mockResolvedValue([{
         feeGroup: { heads: [{ id: 'h1', defaultAmount: '50' }, { id: 'h2', defaultAmount: '50' }] }
      }]);

      await service.pushChanges(changes, 'tenant_1');
      expect(mockTxRepo.save).toHaveBeenCalledTimes(2);
      expect(mockTxRepo.softDelete).toHaveBeenCalledTimes(1);
    });

    it('should process expenses', async () => {
       const changes = {
          expenses: {
             created: [{ id: '123e4567-e89b-12d3-a456-426614174000', categoryId: 'cat1', expenseDate: 1234567890000 }],
             updated: [{ id: '223e4567-e89b-12d3-a456-426614174001', categoryId: 'cat2' }]
          }
       };
       const mockExpenseRepo = moduleRef.get(getRepositoryToken(Expense));
       mockExpenseRepo.findOne.mockResolvedValue({ id: '223e4567-e89b-12d3-a456-426614174001' });

       await service.pushChanges(changes, 'tenant_1');
       expect(mockExpenseRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should process attendance, classes, and sections', async () => {
       const changes = {
          attendance: {
             created: [{ id: '123e4567-e89b-12d3-a456-426614174000', date: 1234567890000 }],
             updated: [{ id: '223e4567-e89b-12d3-a456-426614174001', date: 0 }]
          },
          classes: {
             created: [{ id: '323e4567-e89b-12d3-a456-426614174002' }],
             updated: [{ id: '423e4567-e89b-12d3-a456-426614174003' }]
          },
          sections: {
             created: [{ id: '523e4567-e89b-12d3-a456-426614174004' }],
             updated: [{ id: '623e4567-e89b-12d3-a456-426614174005' }]
          }
       };

       const mockAttendanceRepo = moduleRef.get(getRepositoryToken(StudentAttendance));
       mockAttendanceRepo.findOne.mockResolvedValue({ id: '223e4567-e89b-12d3-a456-426614174001' });

       const mockClassRepo = moduleRef.get(getRepositoryToken(Class));
       mockClassRepo.findOne.mockResolvedValue({ id: '423e4567-e89b-12d3-a456-426614174003' });

       const mockSectionRepo = moduleRef.get(getRepositoryToken(Section));
       mockSectionRepo.findOne.mockResolvedValue({ id: '623e4567-e89b-12d3-a456-426614174005' });

       await service.pushChanges(changes, 'tenant_1');
       expect(mockAttendanceRepo.save).toHaveBeenCalledTimes(2);
       expect(mockClassRepo.save).toHaveBeenCalledTimes(2);
       expect(mockSectionRepo.save).toHaveBeenCalledTimes(2);
    });
  });
});
