import { Process, Processor, OnQueueProgress, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
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
    this.logger.log(`Background Email Worker initialized via Amazon SES SMTP (Host: ${smtpConfig.host})`);
  }

  @Process('send-mail')
  async handleSendMail(job: Job<EmailOptions>) {
    const options = job.data;
    try {
      this.logger.log(`Starting background email delivery to: ${options.to}`);
      
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM_EMAIL || 'noreply@sms.school',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email delivered successfully to ${options.to}. MessageID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed delivery to ${options.to}: ${error.message}`);
      throw error; // This allows Bull to handle retries based on queue config
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} persistent failure: ${error.message}`);
  }
}
