import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { SystemSettingsService } from '../system/services/system-settings.service';
import * as dns from 'dns';

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
    // Force use of public DNS if local resolver in Node.js is failing
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch (e) {
      this.logger.warn('Failed to set custom DNS servers, using defaults');
    }
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

      return await this.sendEmail({
        to: email,
        subject: `Welcome to ${schoolName} - Verify Your Email`,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send registration email to ${email}:`, error);
      return false;
    }
  }

  async sendAdmissionWelcomeEmail(
    email: string,
    firstName: string,
    username: string,
    password: string,
    role: 'Student' | 'Parent'
  ): Promise<boolean> {
    try {
      const schoolName = await this.getSchoolName();
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #2c3e50;">Welcome to ${schoolName}!</h2>
          <p>Hi ${firstName},</p>
          <p>Your ${role} account has been successfully created. You can now log in to the school portal to view your details, fees, and results.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Default Password:</strong> ${password}</p>
            <p style="margin: 15px 0 0 0;">
              <a href="${loginUrl}/login" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Log In to Portal
              </a>
            </p>
          </div>
          
          <p style="color: #e74c3c;"><strong>Note:</strong> For security reasons, please change your password after your first login.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px; text-align: center;">
            ${schoolName} Management System
          </p>
        </div>
      `;

      return await this.sendEmail({
        to: email,
        subject: `Welcome to ${schoolName} - Your Login Details`,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
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

      return await this.sendEmail({
        to: email,
        subject: `Password Reset Request - ${schoolName}`,
        html,
      });
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

      return await this.sendEmail({
        to: email,
        subject,
        html,
      });
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

  async sendPaymentReceiptEmail(
    email: string,
    studentName: string,
    amount: string,
    reference: string,
    date: string,
    method: string,
    allocations?: any[],
  ): Promise<boolean> {
    try {
      const schoolName = await this.getSchoolName();
      const allocationHtml = allocations && allocations.length > 0 
        ? `
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Breakdown</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${allocations.map(a => `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #333;">${a.name}</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;"><strong>${a.amount}</strong></td>
                </tr>
              `).join('')}
            </table>
          </div>
        ` 
        : '';

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #4CAF50; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Payment Received</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Thank you for your payment to ${schoolName}</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <p>Hi Parent/Guardian,</p>
            <p>This is to confirm that we have successfully received a payment of <strong>${amount}</strong> for <strong>${studentName}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; font-size: 14px; color: #666;">Transaction Details</p>
              <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <span style="font-size: 14px;">Reference:</span>
                <span style="font-size: 14px; font-weight: bold;">${reference}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <span style="font-size: 14px;">Date:</span>
                <span style="font-size: 14px; font-weight: bold;">${date}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <span style="font-size: 14px;">Method:</span>
                <span style="font-size: 14px; font-weight: bold;">${method}</span>
              </div>
            </div>

            ${allocationHtml}

            <p style="margin-top: 30px;">The student's financial records have been updated accordingly. You can view the full history on the student portal.</p>
          </div>
          
          <div style="background-color: #f1f1f1; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; color: #888; font-size: 12px;">&copy; ${new Date().getFullYear()} ${schoolName} Management System</p>
          </div>
        </div>
      `;

      return await this.sendEmail({
        to: email,
        subject: `Payment Receipt - ${studentName} - ${reference}`,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send payment receipt to ${email}:`, error);
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
