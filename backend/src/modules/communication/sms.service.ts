import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private username!: string;
  private password!: string;
  private senderId!: string;
  private baseUrl!: string;

  constructor() {
    this.initializeKudiSMS();
  }

  private initializeKudiSMS() {
    this.username = process.env.KUDISMS_USERNAME || '';
    this.password = process.env.KUDISMS_PASSWORD || '';
    this.senderId = process.env.KUDISMS_SENDER_ID || 'N-Alert';
    this.baseUrl = 'https://account.kudisms.net/api/';

    if (!this.username || !this.password) {
      this.logger.warn('KudiSMS credentials not configured. SMS service will not work.');
      return;
    }

    this.logger.log('SMS service initialized with KudiSMS');
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

  async sendPaymentReceiptSms(
    phoneNumber: string,
    studentName: string,
    amount: string,
    reference: string
  ): Promise<boolean> {
    try {
      const message = `Payment Success! We've received ${amount} for ${studentName}. Ref: ${reference}. Thank you!`;
      return await this.sendSms(phoneNumber, message);
    } catch (error: any) {
      this.logger.error(`Failed to send payment receipt SMS to ${phoneNumber}:`, error.message);
      return false;
    }
  }

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.username || !this.password) {
        this.logger.warn('KudiSMS not initialized. SMS service unavailable.');
        return false;
      }

      // Format phone number to E.164 for Nigeria (234XXXXXXXXXX)
      let to = phoneNumber.replace(/\D/g, '');
      if (to.startsWith('0')) {
        to = '234' + to.substring(1);
      } else if (!to.startsWith('234')) {
        to = '234' + to;
      }

      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('password', this.password);
      params.append('message', message);
      params.append('sender', this.senderId);
      params.append('mobiles', to);

      const response = await axios.post(this.baseUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = typeof response.data === 'string' ? response.data.trim() : JSON.stringify(response.data);
        
        // Simple heuristic: check if response contains error keywords since gateways sometimes return 200 even on API error
        if (responseData.toLowerCase().includes('error') || responseData.toLowerCase().includes('fail')) {
           this.logger.warn(`KudiSMS rejected SMS to ${to}: ${responseData}`);
           return false;
        }

        this.logger.log(`SMS sent to ${to} successfully via KudiSMS.`);
        return true;
      }

      this.logger.error(`KudiSMS HTTP error for ${to}: Status ${response.status}`);
      return false;
    } catch (error: any) {
      this.logger.error(`Unexpected SMS error for ${phoneNumber}: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
      return false;
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      if (!this.username) {
        this.logger.warn('KudiSMS not initialized. OTP verification unavailable.');
        return false;
      }

      // Placeholder: Implement any verification logic
      this.logger.log(`OTP verification initiated for ${phoneNumber}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to verify OTP for ${phoneNumber}:`, error.message);
      return false;
    }
  }
}
