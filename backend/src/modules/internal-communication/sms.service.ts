import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface SmsOptions {
  to: string;
  message: string;
  logId?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private apiKey!: string;
  private baseUrl!: string;
  private senderId!: string;
  private channel!: string;

  constructor(
    @InjectQueue('sms') private readonly smsQueue: Queue
  ) {
    this.initializeTermii();
  }

  private initializeTermii() {
    this.apiKey = process.env.TERMII_API_KEY || '';
    this.baseUrl = process.env.TERMII_BASE_URL || 'https://api.termii.com';
    this.senderId = process.env.TERMII_SENDER_ID || 'SMS-SCHOOL';
    this.channel = process.env.TERMII_CHANNEL || 'generic';

    if (!this.apiKey) {
      this.logger.warn('Termii API Key not configured. SMS service will not work.');
      return;
    }

    this.logger.log(`SMS service initialized with Termii (Channel: ${this.channel})`);
  }

  async sendRegistrationOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SMS registration OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
      return await this.sendSms({ to: phoneNumber, message });
    } catch (error: any) {
      this.logger.error(`Failed to send registration OTP to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendLoginOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SMS login OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      return await this.sendSms({ to: phoneNumber, message });
    } catch (error: any) {
      this.logger.error(`Failed to send login OTP to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendPasswordResetOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your password reset OTP is: ${otp}. Valid for 15 minutes. Do not share with anyone.`;
      return await this.sendSms({ to: phoneNumber, message });
    } catch (error: any) {
      this.logger.error(`Failed to send password reset OTP to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendPaymentReminderSms(phoneNumber: string, studentName: string, balance: string, message?: string): Promise<boolean> {
    try {
      const smsMessage = message || `Payment Reminder: ward ${studentName} has a balance of ${balance}. Kindly clear at your earliest convenience.`;
      return await this.sendSms({ to: phoneNumber, message: smsMessage });
    } catch (error: any) {
      this.logger.error(`Failed to send payment reminder SMS to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendNotificationSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      return await this.sendSms({ to: phoneNumber, message });
    } catch (error: any) {
      this.logger.error(`Failed to send notification SMS to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendPaymentReceiptSms(
    phoneNumber: string,
    studentName: string,
    amount: string,
    reference: string
  ): Promise<boolean> {
    try {
      const message = `Payment Success! We've received ${amount} for ${studentName}. Ref: ${reference}. Please Kindly Check your Mail to Print the Reciept. Thank you!`;
      return await this.sendSms({ to: phoneNumber, message });
    } catch (error: any) {
      this.logger.error(`Failed to send payment receipt SMS to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendSms(options: SmsOptions, delay = 0): Promise<boolean> {
    try {
      await this.smsQueue.add('send-sms', options, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        delay,
      });
      this.logger.log(`SMS job queued successfully to: ${options.to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to queue SMS job: ${error.message}`);
      return false;
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      this.logger.log(`OTP verification initiated for ${phoneNumber}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to verify OTP for ${phoneNumber}:`, error.message);
      return false;
    }
  }
}
