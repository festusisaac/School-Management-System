import { Process, Processor, OnQueueProgress, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { EmailOptions } from '@modules/internal-communication/email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: any;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
    const provider = process.env.MAIL_PROVIDER || 'smtp';
    this.logger.log(`Background Email Worker initialized. Primary Provider: ${provider.toUpperCase()}`);
  }

  @Process('send-mail')
  async handleSendMail(job: Job<EmailOptions>) {
    const options = job.data;
    const provider = (process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
    
    try {
      this.logger.log(`Starting background email delivery to: ${options.to} using ${provider.toUpperCase()}`);
      
      const fromEmail = options.from || process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@sms.school';
      
      if (provider === 'resend' && process.env.RESEND_API_KEY) {
        // Resend API Implementation
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: fromEmail,
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        this.logger.log(`Email delivered via Resend to ${options.to}. ID: ${response.data.id}`);
        return true;
      } else {
        // Fallback to Legacy SMTP (SES)
        const mailOptions = {
          from: fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        };

        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Email delivered via SMTP to ${options.to}. MessageID: ${info.messageId}`);
        return true;
      }
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Failed delivery to ${options.to} via ${provider.toUpperCase()}: ${errorMsg}`);
      throw error; 
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} persistent failure: ${error.message}`);
  }
}
