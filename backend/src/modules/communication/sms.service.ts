import { Injectable, Logger } from '@nestjs/common';
import { Termii } from 'termii-nodejs';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private termii: any;

  constructor() {
    this.initializeTermii();
  }

  private initializeTermii() {
    const apiKey = process.env.TERMII_API_KEY;
    if (!apiKey) {
      this.logger.warn('Termii API key not configured. SMS service will not work.');
      return;
    }

    this.termii = new Termii({ apiKey });
    this.logger.log('SMS service initialized with Termii');
  }

  async sendRegistrationOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SMS registration OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send registration OTP to ${phoneNumber}:`, error);
      return false;
    }
  }

  async sendLoginOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SMS login OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send login OTP to ${phoneNumber}:`, error);
      return false;
    }
  }

  async sendPasswordResetOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your password reset OTP is: ${otp}. Valid for 15 minutes. Do not share with anyone.`;
      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to ${phoneNumber}:`, error);
      return false;
    }
  }

  async sendPaymentReminderSms(phoneNumber: string, studentName: string, balance: string, message?: string): Promise<boolean> {
    try {
      const smsMessage = message || `Payment Reminder: ward ${studentName} has a balance of ${balance}. Kindly clear at your earliest convenience.`;
      return await this.sendSms(phoneNumber, smsMessage);
    } catch (error) {
      this.logger.error(`Failed to send payment reminder SMS to ${phoneNumber}:`, error);
      return false;
    }
  }

  async sendNotificationSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send notification SMS to ${phoneNumber}:`, error);
      return false;
    }
  }

  async sendSms(phoneNumber: string, message: string, options: SmsOptions = {} as any): Promise<boolean> {
    try {
      if (!this.termii) {
        this.logger.warn('Termii not initialized. SMS service unavailable.');
        return false;
      }

      const to = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      // Using Termii's SMS sending endpoint (adjust based on actual SDK)
      const response = await this.termii.sms.send({
        to,
        from: process.env.TERMII_SENDER_ID || 'SMSAPP',
        sms: message,
      });

      this.logger.log(`SMS sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return false;
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      if (!this.termii) {
        this.logger.warn('Termii not initialized. OTP verification unavailable.');
        return false;
      }

      // This is a placeholder - actual implementation depends on Termii SDK
      this.logger.log(`OTP verification for ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify OTP for ${phoneNumber}:`, error);
      return false;
    }
  }
}
