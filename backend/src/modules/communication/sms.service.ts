import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private apiKey!: string;
  private senderId!: string;
  private baseUrl!: string;

  constructor() {
    this.initializeTermii();
  }

  private initializeTermii() {
    this.apiKey = process.env.TERMII_API_KEY || '';
    this.senderId = process.env.TERMII_SENDER_ID || 'PHJCNPSS';
    this.baseUrl = 'https://api.ng.termii.com';
    
    if (!this.apiKey) {
      this.logger.warn('Termii API key not configured. SMS service will not work.');
      return;
    }

    this.logger.log('SMS service initialized with Termii');
  }

  async sendRegistrationOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SMS registration OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
      return await this.sendSms(phoneNumber, message);
    } catch (error: any) {
      this.logger.error(`Failed to send registration OTP to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendLoginOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SMS login OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      return await this.sendSms(phoneNumber, message);
    } catch (error: any) {
      this.logger.error(`Failed to send login OTP to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendPasswordResetOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your password reset OTP is: ${otp}. Valid for 15 minutes. Do not share with anyone.`;
      return await this.sendSms(phoneNumber, message);
    } catch (error: any) {
      this.logger.error(`Failed to send password reset OTP to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendPaymentReminderSms(phoneNumber: string, studentName: string, balance: string, message?: string): Promise<boolean> {
    try {
      const smsMessage = message || `Payment Reminder: ward ${studentName} has a balance of ${balance}. Kindly clear at your earliest convenience.`;
      return await this.sendSms(phoneNumber, smsMessage);
    } catch (error: any) {
      this.logger.error(`Failed to send payment reminder SMS to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendNotificationSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      return await this.sendSms(phoneNumber, message);
    } catch (error: any) {
      this.logger.error(`Failed to send notification SMS to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        this.logger.warn('Termii not initialized. SMS service unavailable.');
        return false;
      }

      // Format phone number (Termii likes 23480...)
      let to = phoneNumber.replace(/\D/g, '');
      if (to.startsWith('0')) {
        to = '234' + to.substring(1);
      } else if (!to.startsWith('234')) {
        to = '234' + to;
      }

      const payload = {
        to,
        from: this.senderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: this.apiKey,
      };

      const response = await axios.post(`${this.baseUrl}/api/sms/send`, payload);

      if (response.data && response.status === 200) {
        this.logger.log(`SMS sent successfully to ${to}`);
        return true;
      }

      this.logger.error(`Termii error response: ${JSON.stringify(response.data)}`);
      return false;
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error.response?.data || error.message);
      return false;
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        this.logger.warn('Termii not initialized. OTP verification unavailable.');
        return false;
      }

      // This is a placeholder - actual implementation depends on Termii SDK
      this.logger.log(`OTP verification for ${phoneNumber}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to verify OTP for ${phoneNumber}:`, error.message);
      return false;
    }
  }
}
