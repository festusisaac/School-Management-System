import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaveService } from '../services/leave.service';
import { LeaveType } from '../entities/leave-type.entity';
import { LeaveRequest, LeaveStatus } from '../entities/leave-request.entity';
import { LeaveApproval, ApprovalAction } from '../entities/leave-approval.entity';
import { EntityManager } from 'typeorm';
import { EmailService } from '@modules/internal-communication/email.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '@modules/auth/entities/user.entity';

describe('LeaveService', () => {
  let service: LeaveService;

  const mockLeaveTypeRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockLeaveRequestRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockLeaveApprovalRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEntityManager = {
    find: jest.fn(),
  };

  const mockEmailService = {
    sendNotificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        { provide: getRepositoryToken(LeaveType), useValue: mockLeaveTypeRepository },
        { provide: getRepositoryToken(LeaveRequest), useValue: mockLeaveRequestRepository },
        { provide: getRepositoryToken(LeaveApproval), useValue: mockLeaveApprovalRepository },
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Leave Types', () => {
    it('createLeaveType should save and return leave type', async () => {
      mockLeaveTypeRepository.save.mockResolvedValueOnce({ id: 'lt_1', name: 'Annual', maxDaysPerYear: 10 });
      const result = await service.createLeaveType({ name: 'Annual', maxDays: 10 } as any);
      expect(result.id).toBe('lt_1');
      expect(mockLeaveTypeRepository.save).toHaveBeenCalled();
    });

    it('getLeaveTypes should return active leave types', async () => {
      mockLeaveTypeRepository.find.mockResolvedValueOnce([{ id: 'lt_1' }]);
      const result = await service.getLeaveTypes();
      expect(result).toHaveLength(1);
    });

    it('updateLeaveType should throw NotFoundException if not found', async () => {
      mockLeaveTypeRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.updateLeaveType('invalid', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('updateLeaveType should update and return', async () => {
      const lt = { id: 'lt_1', maxDaysPerYear: 10 };
      mockLeaveTypeRepository.findOne.mockResolvedValueOnce(lt);
      mockLeaveTypeRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.updateLeaveType('lt_1', { maxDays: 15 } as any);
      expect(result.maxDaysPerYear).toBe(15);
    });

    it('deleteLeaveType should mark as inactive', async () => {
      await service.deleteLeaveType('lt_1');
      expect(mockLeaveTypeRepository.update).toHaveBeenCalledWith('lt_1', { isActive: false });
    });
  });

  describe('Leave Requests', () => {
    it('createLeaveRequest should throw if start is after end', async () => {
      await expect(service.createLeaveRequest('staff_1', { startDate: '2023-10-10', endDate: '2023-10-09' } as any)).rejects.toThrow(BadRequestException);
    });

    it('createLeaveRequest should throw if leave type not found', async () => {
      mockLeaveTypeRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.createLeaveRequest('staff_1', { startDate: '2023-10-09', endDate: '2023-10-10', leaveTypeId: 'invalid' } as any)).rejects.toThrow(NotFoundException);
    });

    it('createLeaveRequest should throw if leave limit exceeded', async () => {
      mockLeaveTypeRepository.findOne.mockResolvedValueOnce({ id: 'lt_1', maxDaysPerYear: 5 });
      mockLeaveRequestRepository.find.mockResolvedValueOnce([{ numberOfDays: 4, status: LeaveStatus.APPROVED }]);

      // request is 2 days (10-10 - 10-09 is 1 day diff + 1 = 2 days)
      await expect(service.createLeaveRequest('staff_1', { startDate: '2023-10-09', endDate: '2023-10-10', leaveTypeId: 'lt_1' } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('createLeaveRequest should save request and send emails', async () => {
      mockLeaveTypeRepository.findOne.mockResolvedValueOnce({ id: 'lt_1', maxDaysPerYear: 10, name: 'Sick' });
      mockLeaveRequestRepository.find.mockResolvedValueOnce([]); // used days = 0
      
      const req = { id: 'req_1', staffId: 'staff_1' };
      mockLeaveRequestRepository.create.mockReturnValueOnce(req);
      mockLeaveRequestRepository.save.mockResolvedValueOnce(req);
      
      // email notification mocks
      mockLeaveRequestRepository.findOne.mockResolvedValueOnce({
        id: 'req_1',
        staff: { firstName: 'John', lastName: 'Doe', tenantId: 'tenant_1' },
        leaveType: { name: 'Sick' },
        numberOfDays: 2,
        reason: 'Fever'
      });
      mockEntityManager.find.mockResolvedValueOnce([{ email: 'admin@test.com' }]); // super admins

      const result = await service.createLeaveRequest('staff_1', { startDate: '2023-10-09', endDate: '2023-10-10', leaveTypeId: 'lt_1' } as any);
      
      expect(result.id).toBe('req_1');
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
    });

    it('getLeaveRequestById should return request', async () => {
      mockLeaveRequestRepository.findOne.mockResolvedValueOnce({ id: 'req_1' });
      const result = await service.getLeaveRequestById('req_1');
      expect(result?.id).toBe('req_1');
    });

    it('getStaffLeaveRequests should return requests for staff', async () => {
      mockLeaveRequestRepository.find.mockResolvedValueOnce([{ id: 'req_1' }]);
      const result = await service.getStaffLeaveRequests('staff_1');
      expect(result).toHaveLength(1);
    });

    it('getAllLeaveRequests should return all requests', async () => {
      mockLeaveRequestRepository.find.mockResolvedValueOnce([{ id: 'req_1' }]);
      const result = await service.getAllLeaveRequests();
      expect(result).toHaveLength(1);
    });
  });

  describe('approveLeave', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockLeaveRequestRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.approveLeave('invalid', 'approver_1', 'Approved')).rejects.toThrow(NotFoundException);
    });

    it('should approve leave', async () => {
      const req = { id: 'req_1', status: LeaveStatus.PENDING };
      mockLeaveRequestRepository.findOne.mockResolvedValueOnce(req);
      mockLeaveApprovalRepository.create.mockReturnValueOnce({ id: 'appr_1' });
      mockLeaveApprovalRepository.save.mockResolvedValueOnce({});
      mockLeaveRequestRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.approveLeave('req_1', 'approver_1', 'Approved');
      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(mockLeaveApprovalRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: ApprovalAction.APPROVED }));
    });
    
    it('should reject leave', async () => {
      const req = { id: 'req_1', status: LeaveStatus.PENDING };
      mockLeaveRequestRepository.findOne.mockResolvedValueOnce(req);
      mockLeaveApprovalRepository.create.mockReturnValueOnce({ id: 'appr_1' });
      mockLeaveApprovalRepository.save.mockResolvedValueOnce({});
      mockLeaveRequestRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.approveLeave('req_1', 'approver_1', 'Rejected');
      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(mockLeaveApprovalRepository.create).toHaveBeenCalledWith(expect.objectContaining({ action: ApprovalAction.REJECTED }));
    });
  });

  describe('getLeaveBalance', () => {
    it('should return leave balance', async () => {
      mockLeaveTypeRepository.find.mockResolvedValueOnce([
        { id: 'lt_1', name: 'Annual', maxDaysPerYear: 10 },
        { id: 'lt_2', name: 'Sick', maxDaysPerYear: 5 }
      ]);
      mockLeaveRequestRepository.find.mockResolvedValueOnce([
        { leaveTypeId: 'lt_1', numberOfDays: 4, status: LeaveStatus.APPROVED },
        { leaveTypeId: 'lt_1', numberOfDays: 2, status: LeaveStatus.PENDING }, // total 6 for lt_1
        { leaveTypeId: 'lt_2', numberOfDays: 1, status: LeaveStatus.APPROVED } // total 1 for lt_2
      ]);

      const result = await service.getLeaveBalance('staff_1');
      
      expect(result.totalAvailable).toBe(4 + 4); // (10-6) + (5-1)
      expect(result.details.find(d => d.leaveType === 'Annual')?.available).toBe(4);
      expect(result.details.find(d => d.leaveType === 'Sick')?.available).toBe(4);
    });
  });
});
