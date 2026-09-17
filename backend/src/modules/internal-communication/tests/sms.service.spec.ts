import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { SmsService } from '../sms.service';

describe('SmsService', () => {
  let service: SmsService;

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    mockQueue.add.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: getQueueToken('sms'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendSms', () => {
    it('should queue sms job successfully', async () => {
      mockQueue.add.mockResolvedValueOnce({ id: 'job_1' });
      const res = await service.sendSms({ to: '123456', message: 'T' });
      expect(res).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith('send-sms', expect.any(Object), expect.any(Object));
    });

    it('should handle queue error gracefully', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue Error'));
      const res = await service.sendSms({ to: '123456', message: 'T' });
      expect(res).toBe(false);
    });
  });

  describe('pre-defined sms methods', () => {
    beforeEach(() => {
      jest.spyOn(service, 'sendSms').mockResolvedValue(true);
    });

    it('sendRegistrationOtp', async () => {
      await service.sendRegistrationOtp('1234', '0000');
      expect(service.sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '1234' }));
    });

    it('sendLoginOtp', async () => {
      await service.sendLoginOtp('1234', '0000');
      expect(service.sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '1234' }));
    });

    it('sendPasswordResetOtp', async () => {
      await service.sendPasswordResetOtp('1234', '0000');
      expect(service.sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '1234' }));
    });

    it('sendPaymentReminderSms', async () => {
      await service.sendPaymentReminderSms('1234', 'S', '100');
      expect(service.sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '1234' }));
    });

    it('sendNotificationSms', async () => {
      await service.sendNotificationSms('1234', 'Msg');
      expect(service.sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '1234' }));
    });

    it('sendPaymentReceiptSms', async () => {
      await service.sendPaymentReceiptSms('1234', 'S', '100', 'ref');
      expect(service.sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '1234' }));
    });

    it('verifyOtp', async () => {
      const res = await service.verifyOtp('1234', '0000');
      expect(res).toBe(true);
    });
  });
});
