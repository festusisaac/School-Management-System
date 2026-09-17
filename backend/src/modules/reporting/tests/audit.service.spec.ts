import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../services/audit.service';
import { ActivityLog } from '../../system/entities/activity-log.entity';
import { CommunicationLog } from '../../communication/entities/communication-log.entity';
import { Transaction } from '../../finance/entities/transaction.entity';

describe('AuditService', () => {
  let service: AuditService;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockActivityLogRepo = {
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockCommunicationLogRepo = {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockTransactionRepo = {
    count: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(ActivityLog), useValue: mockActivityLogRepo },
        { provide: getRepositoryToken(CommunicationLog), useValue: mockCommunicationLogRepo },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview stats', async () => {
      const res = await service.getOverview('tenant_1');
      expect(res.metrics).toBeDefined();
      expect(res.topActions).toBeDefined();
      expect(res.communicationByStatus).toBeDefined();
      expect(res.recentActivity).toBeDefined();
      expect(res.recentCommunication).toBeDefined();
    });
  });

  describe('getActivityLogs', () => {
    it('should return logs', async () => {
      const res = await service.getActivityLogs('tenant_1', { search: 'test', action: 'login', portal: 'admin', dateFrom: '2026-01-01', dateTo: '2026-12-31' });
      expect(res.items).toBeDefined();
      expect(res.total).toBe(0);
      expect(res.page).toBe(1);
    });
  });

  describe('getCommunicationLogs', () => {
    it('should return logs', async () => {
      const res = await service.getCommunicationLogs('tenant_1', { search: 'test', type: 'email', status: 'delivered', dateFrom: '2026-01-01', dateTo: '2026-12-31' });
      expect(res.items).toBeDefined();
      expect(res.total).toBe(0);
    });
  });
});
