import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SystemSettingsService } from '../system/services/system-settings.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;

  constructor(private readonly systemSettingsService: SystemSettingsService) {
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
    this.logger.log('Email service initialized with SMTP configuration');
  }

  private async getSchoolName(): Promise<string> {
    try {
      const settings = await this.systemSettingsService.getSettings();
      return settings.schoolName || 'School Management System';
    } catch (error) {
      return 'School Management System';
    }
  }

  async sendRegistrationEmail(email: string, firstName: string, verificationLink: string): Promise<boolean> {
    try {
      const schoolName = await this.getSchoolName();
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${schoolName}!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <p>
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Verify Email Address
            </a>
          </p>
          <p>If you did not create this account, please ignore this email.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            ${schoolName}
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email,
        subject: `Welcome to ${schoolName} - Verify Your Email`,
        html,
      });

      this.logger.log(`Registration email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send registration email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<boolean> {
    try {
      const schoolName = await this.getSchoolName();
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your password. Click the link below to proceed:</p>
          <p>
            <a href="${resetLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Reset Your Password
            </a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            ${schoolName}
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email,
        subject: `Password Reset Request - ${schoolName}`,
        html,
      });

      this.logger.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      return false;
    }
  }

  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
    title: string,
  ): Promise<boolean> {
    try {
      const schoolName = await this.getSchoolName();
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${message}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            ${schoolName}
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email,
        subject,
        html,
      });

      this.logger.log(`Notification email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${email}:`, error);
      return false;
    }
  }

  async sendPaymentReminderEmail(
    email: string,
    studentName: string,
    balance: string,
    dueDate: string,
    message?: string,
  ): Promise<boolean> {
    try {
      const schoolName = await this.getSchoolName();
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-top: 4px solid #f44336; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f44336;">Payment Reminder</h2>
          <p>Hi Parent/Guardian of <strong>${studentName}</strong>,</p>
          <p>This is a friendly reminder regarding the outstanding balance of <strong>${balance}</strong> in your ward's school fees account at <strong>${schoolName}</strong>.</p>
          <p>The due date for payment is <strong>${dueDate}</strong>.</p>
          ${message ? `<p style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; font-style: italic;">${message}</p>` : ''}
          <p>Kindly ignore this message if payment has already been made.</p>
          <p>Thank you for your cooperation.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px; text-align: center;">
            ${schoolName} Finance Team
          </p>
        </div>
      `;

      return await this.sendEmail({
        to: email,
        subject: `Payment Reminder - ${studentName}`,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send payment reminder to ${email}:`, error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM_EMAIL || 'noreply@sms.school',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}
