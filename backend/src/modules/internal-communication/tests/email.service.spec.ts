import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { EmailService } from '../email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');
jest.mock('dns', () => ({
  setServers: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({});
    mockQueue.add.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getQueueToken('email'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  describe('sendEmail', () => {
    it('should queue email job successfully', async () => {
      mockQueue.add.mockResolvedValueOnce({ id: 'job_1' });
      const res = await service.sendEmail({ to: 'test@test.com', subject: 'T' });
      expect(res).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith('send-mail', expect.any(Object), expect.any(Object));
    });

    it('should handle queue error gracefully', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue Error'));
      const res = await service.sendEmail({ to: 'test@test.com', subject: 'T' });
      expect(res).toBe(false);
    });
  });

  describe('pre-defined email methods', () => {
    beforeEach(() => {
      jest.spyOn(service, 'sendEmail').mockResolvedValue(true);
    });

    it('sendRegistrationEmail', async () => {
      await service.sendRegistrationEmail('a@b.com', 'John', 'http://link');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendAdmissionWelcomeEmail', async () => {
      await service.sendAdmissionWelcomeEmail('a@b.com', 'John', 'usr', 'pwd', 'Student');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendConsolidatedAdmissionEmail', async () => {
      await service.sendConsolidatedAdmissionEmail({
        email: 'a@b.com',
        guardianName: 'G',
        studentName: 'S',
        admissionNo: 'A1',
        parentUsername: 'P',
      });
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendPaymentReceiptEmail', async () => {
      await service.sendPaymentReceiptEmail('a@b.com', 'S', '100', 'ref', 'date', 'cash');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendPaymentReminderEmail', async () => {
      await service.sendPaymentReminderEmail('a@b.com', 'S', '100', 'date');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendNotificationEmail', async () => {
      await service.sendNotificationEmail('a@b.com', 'S', 'M', 'T');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendPasswordChangedNotification', async () => {
      await service.sendPasswordChangedNotification('a@b.com', 'N', 'P');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendPasswordResetEmail', async () => {
      await service.sendPasswordResetEmail('a@b.com', 'N', 'L');
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });

    it('sendStaffWelcomeEmail', async () => {
      await service.sendStaffWelcomeEmail({
        email: 'a@b.com',
        firstName: 'F',
        lastName: 'L',
        employeeId: 'E',
        password: 'P',
      });
      expect(service.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
    });
  });
});
