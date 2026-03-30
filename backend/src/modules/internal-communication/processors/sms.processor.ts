import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import axios from 'axios';

export interface SmsJobOptions {
  to: string;
  message: string;
}

@Processor('sms')
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);
  private username = process.env.KUDISMS_USERNAME || '';
  private password = process.env.KUDISMS_PASSWORD || '';
  private senderId = process.env.KUDISMS_SENDER_ID || 'N-Alert';
  private baseUrl = 'https://account.kudisms.net/api/';

  @Process('send-sms')
  async handleSendSms(job: Job<SmsJobOptions>) {
    const { to, message } = job.data;
    
    try {
      this.logger.log(`Starting background SMS delivery to: ${to}`);

      if (!this.username || !this.password) {
        throw new Error('KudiSMS credentials not configured');
      }

      // Format phone number (Nigeria 234 prefix logic)
      let formattedTo = to.replace(/\D/g, '');
      if (formattedTo.startsWith('0')) {
        formattedTo = '234' + formattedTo.substring(1);
      } else if (!formattedTo.startsWith('234')) {
        formattedTo = '234' + formattedTo;
      }

      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('password', this.password);
      params.append('message', message);
      params.append('sender', this.senderId);
      params.append('mobiles', formattedTo);

      const response = await axios.post(this.baseUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = typeof response.data === 'string' ? response.data.trim() : JSON.stringify(response.data);
        if (responseData.toLowerCase().includes('error') || responseData.toLowerCase().includes('fail')) {
           throw new Error(`KudiSMS rejected SMS: ${responseData}`);
        }
        this.logger.log(`SMS delivered to ${formattedTo} successfully.`);
        return true;
      }

      throw new Error(`KudiSMS HTTP Error: ${response.status}`);
    } catch (error: any) {
      this.logger.error(`SMS delivery failed to ${to}: ${error.message}`);
      throw error; // Retries handled by Bull
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} persistent failure: ${error.message}`);
  }
}
