import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLogService } from '../services/activity-log.service';
import { ActivityLog } from '../entities/activity-log.entity';

describe('ActivityLogService', () => {
  let service: ActivityLogService;

  const mockActivityLogRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockActivityLogRepo,
        },
      ],
    }).compile();

    service = module.get<ActivityLogService>(ActivityLogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log action', async () => {
    const data = { userEmail: 'test@test.com', action: 'TEST_ACTION' };
    mockActivityLogRepo.create.mockReturnValue(data);
    mockActivityLogRepo.save.mockResolvedValue({ id: '1', ...data });

    const result = await service.logAction(data);
    expect(result.id).toBe('1');
    expect(mockActivityLogRepo.create).toHaveBeenCalledWith(data);
    expect(mockActivityLogRepo.save).toHaveBeenCalled();
  });

  it('should get logs with limit', async () => {
    mockActivityLogRepo.find.mockResolvedValue([{ id: '1' }]);
    
    const result = await service.getLogs(50);
    expect(result.length).toBe(1);
    expect(mockActivityLogRepo.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  });

  it('should get logs with default limit', async () => {
    mockActivityLogRepo.find.mockResolvedValue([{ id: '1' }]);
    
    const result = await service.getLogs();
    expect(result.length).toBe(1);
    expect(mockActivityLogRepo.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  });
});
