import { Process, Processor, OnQueueProgress, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { EmailOptions } from '@modules/internal-communication/email.service';
import { filterValidEmails } from '../../../common/utils/email-validator.util';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationLog } from '../../communication/entities/communication-log.entity';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: any;
  private readonly portalUrl = process.env.FRONTEND_URL || 'https://phjcschool.com.ng';
  private readonly backendUrl = process.env.BACKEND_URL || 'https://api.phjcschool.com.ng';

  constructor(
    @Inject(forwardRef(() => SystemSettingsService))
    private readonly systemSettingsService: SystemSettingsService,
    @InjectRepository(CommunicationLog)
    private readonly logRepository: Repository<CommunicationLog>,
  ) {
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

  private formatHtmlContent(content: string, settings: any): string {
    if (!content) return '';
    
    // Check if content already contains complex HTML tags (beyond simple common ones)
    const hasComplexHtml = /<(html|body|table|div|section)/i.test(content);
    
    if (hasComplexHtml) return content;

    const schoolName = settings?.schoolName || 'Our School';
    const primaryColor = settings?.primaryColor || '#4f46e5';
    const address = settings?.schoolAddress || '';
    const phone = settings?.schoolPhone || '';
    const email = settings?.schoolEmail || '';
    let logoUrl = settings?.primaryLogo;
    if (logoUrl && !logoUrl.startsWith('http')) {
      const cleanPath = logoUrl.startsWith('/') ? logoUrl.substring(1) : logoUrl;
      logoUrl = `${this.backendUrl}/${cleanPath}`;
    }

    // Convert newlines to <br/> for plain text
    const bodyContent = content.replace(/\n/g, '<br/>');
    
    // Antigravity Trick: Hidden unique string to prevent Gmail "content trimming"
    const uniqueEmailId = Date.now().toString(36);

    // Professional HTML Template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #1f2937; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
          .header { padding: 30px; text-align: center; border-bottom: 4px solid ${primaryColor}; }
          .logo { max-height: 70px; width: auto; margin-bottom: 12px; border: 0; }
          .school-name { font-size: 22px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.025em; }
          .content { padding: 25px 35px 15px; line-height: 1.6; font-size: 16px; min-height: 80px; color: #374151; white-space: pre-wrap; word-break: break-word; }
          .cta-container { padding: 15px 35px 35px; text-align: center; }
          .cta-button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .footer { padding: 30px; background-color: #f3f4f6; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; }
          .footer-links { margin-top: 15px; }
          .footer-link { color: ${primaryColor}; text-decoration: none; margin: 0 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${schoolName}" class="logo">` : ''}
            <div class="school-name">${schoolName}</div>
          </div>
          <div class="content">
            ${bodyContent}
            <div style="display: none; visibility: hidden; opacity: 0; font-size: 1px; color: transparent;">ID: ${uniqueEmailId}</div>
          </div>
          <div class="cta-container">
            <a href="${this.portalUrl}" class="cta-button">Login to Portal</a>
          </div>
          <div class="footer">
            <p><strong>${schoolName}</strong></p>
            ${address ? `<p>${address}</p>` : ''}
            <p>${phone ? `Phone: ${phone}` : ''} ${email ? ` | Email: ${email}` : ''}</p>
            <div class="footer-links">
              <a href="${this.portalUrl}" class="footer-link">Dashboard</a>
              <a href="${this.portalUrl}/support" class="footer-link">Support</a>
            </div>
            <p style="margin-top: 20px; font-size: 11px;">This is an automated notification from the School Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  @Process('send-mail')
  async handleSendMail(job: Job<EmailOptions>) {
    const options = job.data;
    const provider = (process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
    
    try {
      this.logger.log(`Starting background email delivery to: ${options.to} using ${provider.toUpperCase()}`);
      
      let fromEmail = options.from || process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@sms.school';
      
      // Robustness check: if fromEmail is just a domain (no @), prefix with noreply@
      if (!fromEmail.includes('@')) {
        fromEmail = `noreply@${fromEmail}`;
      }

      // Final recipients validation: Filter out invalid emails (like admission numbers)
      const validRecipients = filterValidEmails(options.to);
      if (validRecipients.length === 0) {
        this.logger.warn(`Skipping email delivery: No valid email addresses found in 'to' field: ${options.to}`);
        return true; // Mark as done to avoid retries
      }
      
      // Get current branding settings
      const settings = await this.systemSettingsService.getSettings();
      const formattedHtml = this.formatHtmlContent(options.html || '', settings);

      // Enhance fromEmail with School Name for better inbox presence
      const senderName = settings.emailFromName || settings.schoolName || 'School Notification';
      if (!fromEmail.includes('<')) {
        fromEmail = `${senderName} <${fromEmail}>`;
      }
      
      if (provider === 'resend' && process.env.RESEND_API_KEY) {
        // Resend API Implementation
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: fromEmail,
            to: validRecipients,
            subject: options.subject,
            html: formattedHtml,
            text: options.text || options.html, // Fallback text to html if missing
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        this.logger.log(`Email delivered via Resend to ${options.to}. ID: ${response.data.id}`);
        
        if (options.logId) {
          await this.logRepository.update(options.logId, { providerMessageId: response.data.id });
        }
        return true;
      } else {
        // Fallback to Legacy SMTP (SES)
        const mailOptions = {
          from: fromEmail,
          to: validRecipients,
          subject: options.subject,
          html: formattedHtml,
          text: options.text || options.html,
        };

        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Email delivered via SMTP to ${options.to}. MessageID: ${info.messageId}`);
        
        if (options.logId) {
           await this.logRepository.update(options.logId, { providerMessageId: info.messageId });
        }
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
