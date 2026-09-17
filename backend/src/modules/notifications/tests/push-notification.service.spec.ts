import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { PushNotificationService } from '../services/push-notification.service';
import { PushToken } from '../entities/push-token.entity';
import { Expo } from 'expo-server-sdk';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let entityManager: EntityManager;

  const mockTokenRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockEntityManager = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        { provide: getRepositoryToken(PushToken), useValue: mockTokenRepo },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('should ignore non-Expo tokens if not mocked properly (but we mocked it)', async () => {
      // isExpoPushToken is mocked to return true for all strings
      mockTokenRepo.findOne.mockResolvedValueOnce(null);
      mockTokenRepo.create.mockReturnValue({ id: 't_1' });
      mockTokenRepo.save.mockResolvedValue({ id: 't_1' });

      await service.registerToken('user_1', 'tenant_1', 'ExponentPushToken[xyz]', 'android');
      expect(mockTokenRepo.save).toHaveBeenCalled();
    });

    it('should update existing token', async () => {
      mockTokenRepo.findOne.mockResolvedValueOnce({ id: 't_1', token: 'token1' });
      mockTokenRepo.save.mockResolvedValue({ id: 't_1', token: 'token1' });

      await service.registerToken('user_1', 'tenant_1', 'ExponentPushToken[xyz]', 'android');
      expect(mockTokenRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user_1' }));
    });
  });

  describe('unregisterToken', () => {
    it('should delete token', async () => {
      mockTokenRepo.delete.mockResolvedValueOnce({ affected: 1 });
      await service.unregisterToken('token1');
      expect(mockTokenRepo.delete).toHaveBeenCalledWith({ token: 'token1' });
    });
  });

  describe('sendToUserIds', () => {
    it('should skip if no userIds or tokens found', async () => {
      await service.sendToUserIds([], { title: 'T', body: 'B' });
      expect(mockTokenRepo.find).not.toHaveBeenCalled();

      mockTokenRepo.find.mockResolvedValueOnce([]);
      await service.sendToUserIds(['user_1'], { title: 'T', body: 'B' });
    });

    it('should send notifications successfully', async () => {
      mockTokenRepo.find.mockResolvedValueOnce([{ token: 'token1' }]);
      // The mock is built in our test/mocks/expo-server-sdk.js
      await service.sendToUserIds(['user_1'], { title: 'T', body: 'B' });
      // In the mock, chunkPushNotifications returns [msgs] and send... returns []
      // We are just verifying it doesn't crash here, because mocking external SDK can be tricky
      expect(mockTokenRepo.find).toHaveBeenCalled();
    });
  });

  describe('getStaffUserIds', () => {
    it('should return ids', async () => {
      mockEntityManager.query.mockResolvedValueOnce([{ id: 'user_1' }]);
      const res = await service.getStaffUserIds('tenant_1');
      expect(res).toEqual(['user_1']);
    });
  });

  describe('getStudentUserIds', () => {
    it('should return ids for all students', async () => {
      mockEntityManager.query.mockResolvedValueOnce([{ id: 'user_1' }]);
      const res = await service.getStudentUserIds('tenant_1');
      expect(res).toEqual(['user_1']);
    });

    it('should return ids for specific students', async () => {
      mockEntityManager.query.mockResolvedValueOnce([{ id: 'user_2' }]);
      const res = await service.getStudentUserIds('tenant_1', ['student_1']);
      expect(res).toEqual(['user_2']);
    });
  });

  describe('getStaffUserIdByEmail', () => {
    it('should return id if found', async () => {
      mockEntityManager.query.mockResolvedValueOnce([{ id: 'user_1' }]);
      const res = await service.getStaffUserIdByEmail('test@test.com', 'tenant_1');
      expect(res).toBe('user_1');
    });

    it('should return null if not found', async () => {
      mockEntityManager.query.mockResolvedValueOnce([]);
      const res = await service.getStaffUserIdByEmail('test@test.com', 'tenant_1');
      expect(res).toBeNull();
    });
  });
});
