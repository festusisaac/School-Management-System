import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationLog } from '../../communication/entities/communication-log.entity';

export interface SmsJobOptions {
  to: string;
  message: string;
  logId?: string;
}

@Processor('sms')
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);
  private apiKey = process.env.TERMII_API_KEY || '';
  private senderId = process.env.TERMII_SENDER_ID || 'SMS-SCHOOL';
  private baseUrl = process.env.TERMII_BASE_URL || 'https://api.termii.com';
  private channel = process.env.TERMII_CHANNEL || 'generic';

  constructor(
    @InjectRepository(CommunicationLog)
    private readonly logRepository: Repository<CommunicationLog>,
  ) {}

  @Process('send-sms')
  async handleSendSms(job: Job<SmsJobOptions>) {
    const { to, message } = job.data;
    
    try {
      this.logger.log(`Starting background SMS delivery to: ${to}`);

      if (!this.apiKey) {
        throw new Error('Termii API Key not configured');
      }

      // Format phone number (Termii requires international format without +)
      let formattedTo = to.replace(/\D/g, '');
      if (formattedTo.startsWith('0')) {
        formattedTo = '234' + formattedTo.substring(1);
      } else if (!formattedTo.startsWith('234')) {
        formattedTo = '234' + formattedTo;
      }

      const payload = {
        api_key: this.apiKey,
        to: [formattedTo],
        from: this.senderId,
        sms: message,
        type: 'plain',
        channel: this.channel,
      };

      const response = await axios.post(`${this.baseUrl}/api/sms/send`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`SMS delivered to ${formattedTo} via Termii successfully.`);
        
        // Termii response typically includes message_id
        const providerId = response.data?.message_id;
        if (job.data.logId && providerId) {
          await this.logRepository.update(job.data.logId, { providerMessageId: providerId });
        }
        return true;
      }

      throw new Error(`Termii HTTP Error: ${response.status} - ${JSON.stringify(response.data)}`);
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
