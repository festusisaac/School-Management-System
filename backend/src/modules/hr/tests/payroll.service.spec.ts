import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PayrollService } from '../services/payroll.service';
import { Payroll, PayrollStatus } from '../entities/payroll.entity';
import { Staff } from '../entities/staff.entity';
import { StaffAttendance, AttendanceStatus } from '../entities/staff-attendance.entity';
import { LeaveRequest, LeaveStatus } from '../entities/leave-request.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('moment', () => {
  const original = jest.requireActual('moment');
  const momentFn = function(param: any) {
    if (param && Array.isArray(param) && param.length === 2) {
       // mock behavior for moment([year, month-1])
       return original(new Date(param[0], param[1]));
    }
    return original(param);
  };
  // copy original properties if needed
  Object.assign(momentFn, original);
  return momentFn;
});

describe('PayrollService', () => {
  let service: PayrollService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockPayrollRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockStaffRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockAttendanceRepository = {
    find: jest.fn(),
  };

  const mockLeaveRequestRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: getRepositoryToken(Payroll), useValue: mockPayrollRepository },
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepository },
        { provide: getRepositoryToken(StaffAttendance), useValue: mockAttendanceRepository },
        { provide: getRepositoryToken(LeaveRequest), useValue: mockLeaveRequestRepository },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockPayrollRepository.findOne.mockReset();
    mockStaffRepository.findOne.mockReset();
    mockQueryBuilder.getMany.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if payroll already exists', async () => {
      mockPayrollRepository.findOne.mockResolvedValueOnce({ id: 'payroll_1' });
      await expect(service.create({ staffId: 'staff_1', month: 1, year: 2023 } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if staff not found', async () => {
      mockPayrollRepository.findOne.mockResolvedValueOnce(null);
      mockStaffRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.create({ staffId: 'invalid', month: 1, year: 2023 } as any)).rejects.toThrow(NotFoundException);
    });

    it('should create payroll and calculate deductions', async () => {
      mockPayrollRepository.findOne.mockResolvedValueOnce(null);
      mockStaffRepository.findOne.mockResolvedValueOnce({ id: 'staff_1', basicSalary: 3000, allowances: [], deductions: [] });
      
      // getAttendanceSummary mocks
      mockAttendanceRepository.find.mockResolvedValueOnce([]); // no attendance records
      mockLeaveRequestRepository.find.mockResolvedValueOnce([
        { numberOfDays: 2, leaveType: { isPaid: false } } // unpaid leave
      ]);

      mockPayrollRepository.create.mockImplementationOnce(val => val);
      mockPayrollRepository.save.mockImplementationOnce(val => Promise.resolve({ ...val, id: 'new_payroll' }));

      const result = await service.create({ staffId: 'staff_1', month: 1, year: 2023 } as any);
      
      expect(result.id).toBe('new_payroll');
      expect(result.deductions.length).toBe(1); // loss of pay
      expect(result.deductions[0].name).toContain('Loss of Pay');
      expect(result.grossSalary).toBe(3000);
    });
  });

  describe('getAttendanceSummary', () => {
    it('should correctly calculate summary', async () => {
      mockAttendanceRepository.find.mockResolvedValueOnce([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.HALF_DAY },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.ON_LEAVE }
      ]);

      mockLeaveRequestRepository.find.mockResolvedValueOnce([
        { numberOfDays: 1, leaveType: { isPaid: false } }
      ]);

      const result = await service.getAttendanceSummary('staff_1', 1, 2023);
      
      expect(result.presentDays).toBe(2.5); // 1 present + 1 late + 0.5 half day
      expect(result.absentDays).toBe(1);
      expect(result.leaveDays).toBe(1);
      expect(result.unpaidLeaveDays).toBe(1);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        { netSalary: 1000, status: PayrollStatus.PAID, staff: { department: { name: 'IT' } } },
        { netSalary: 1500, status: PayrollStatus.PENDING, staff: { department: { name: 'IT' } } },
      ]);
      
      mockPayrollRepository.find.mockResolvedValue([]); // for the 6 months loop

      const result = await service.getAnalytics(1, 2023);
      
      expect(result.totalPayout).toBe(2500);
      expect(result.totalStaff).toBe(2);
      expect(result.paidCount).toBe(1);
      expect(result.departmentData[0]).toEqual({ name: 'IT', value: 2500 });
      expect(result.monthlyTrends).toHaveLength(6);
    });
  });

  describe('bulkGenerate', () => {
    it('should skip existing and generate for active staff', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        { id: 'staff_1' },
        { id: 'staff_2' }
      ]);
      
      // staff_1 has existing payroll
      mockPayrollRepository.findOne.mockResolvedValueOnce({ id: 'payroll_1' });
      
      // staff_2 does not
      mockPayrollRepository.findOne.mockResolvedValueOnce(null);
      // staff_2 create
      jest.spyOn(service, 'create').mockResolvedValueOnce({} as any);

      const result = await service.bulkGenerate({ month: 1, year: 2023 } as any);
      
      expect(result.skipped).toBe(1);
      expect(result.generated).toBe(1);
    });

    it('should catch errors in generation and increment skipped', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'staff_1' }]);
      mockPayrollRepository.findOne.mockResolvedValueOnce(null);
      jest.spyOn(service, 'create').mockRejectedValueOnce(new Error('Failed'));

      const result = await service.bulkGenerate({ month: 1, year: 2023 } as any);
      
      expect(result.skipped).toBe(1);
      expect(result.generated).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return list of payrolls', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'payroll_1' }]);
      const result = await service.findAll({ month: 1, year: 2023, staffId: 'staff_1', sectionId: 'section_1' });
      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockPayrollRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should return payroll', async () => {
      mockPayrollRepository.findOne.mockResolvedValueOnce({ id: 'payroll_1' });
      const result = await service.findOne('payroll_1');
      expect(result.id).toBe('payroll_1');
    });
  });

  describe('updateStatus', () => {
    it('should update status and return', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'payroll_1' } as any);
      mockPayrollRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.updateStatus('payroll_1', { status: PayrollStatus.PAID } as any);
      
      expect(result.status).toBe(PayrollStatus.PAID);
      expect(result.paymentDate).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should throw if paid', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 'payroll_1', status: PayrollStatus.PAID } as any);
      await expect(service.remove('payroll_1')).rejects.toThrow(BadRequestException);
    });

    it('should remove if not paid', async () => {
      const payroll = { id: 'payroll_1', status: PayrollStatus.PENDING };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(payroll as any);
      await service.remove('payroll_1');
      expect(mockPayrollRepository.remove).toHaveBeenCalledWith(payroll);
    });
  });
});
