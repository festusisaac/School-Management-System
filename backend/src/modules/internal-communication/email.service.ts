import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as dns from 'dns';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  logId?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue
  ) {
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
    this.logger.log(`Email service initialized via Amazon SES SMTP (Host: ${smtpConfig.host})`);
  }

  async sendEmail(options: EmailOptions, delay = 0): Promise<boolean> {
    try {
      await this.emailQueue.add('send-mail', options, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        delay,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to queue email job:', error);
      return false;
    }
  }

  async sendRegistrationEmail(email: string, firstName: string, verificationLink: string, schoolName = 'School Management System'): Promise<boolean> {
    const html = `<p>Hi ${firstName}, please verify your email: <a href="${verificationLink}">Verify</a></p>`;
    return this.sendEmail({ to: email, subject: `Welcome to ${schoolName}`, html });
  }

  async sendAdmissionWelcomeEmail(email: string, firstName: string, username: string, password: string, role: string, schoolName = 'School Management System'): Promise<boolean> {
    const html = `<p>Welcome ${firstName}, your ${role} account is ready. Username: ${username}, Password: ${password}</p>`;
    return this.sendEmail({ to: email, subject: `Login Details - ${schoolName}`, html });
  }

  async sendConsolidatedAdmissionEmail(options: {
    email: string;
    guardianName: string;
    studentName: string;
    admissionNo: string;
    parentUsername: string;
    parentPassword: string;
    schoolName?: string;
    portalUrl?: string;
    admissionLetterHtml?: string;
  }): Promise<boolean> {
    const { 
      email, 
      guardianName, 
      studentName, 
      admissionNo, 
      parentUsername, 
      parentPassword, 
      schoolName = 'Our School', 
      portalUrl = process.env.FRONTEND_URL || 'https://phjcschool.com.ng',
      admissionLetterHtml
    } = options;

    const mainContent = admissionLetterHtml || `
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${guardianName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">We are pleased to inform you that the admission for <strong>${studentName}</strong> (Admission No: ${admissionNo}) has been successfully processed and approved.</p>
    `;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Student Admission Approved</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px;">Welcome to ${schoolName}</p>
        </div>
        
        <div style="padding: 32px; background: white;">
          ${mainContent}
          
          <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px;">
            <h3 style="margin-top: 0; color: #2563eb; font-size: 18px;">Parent Portal Access</h3>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Use the credentials below to access your personal parent portal to track academic progress and manage fees.</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 100px;">Portal URL:</td>
                <td style="padding: 8px 0;"><a href="${portalUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${portalUrl}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Username:</td>
                <td style="padding: 8px 0; font-family: monospace; font-weight: bold; background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${parentUsername}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Password:</td>
                <td style="padding: 8px 0; font-family: monospace; font-weight: bold; background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${parentPassword}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #94a3b8; font-style: italic;">Note: For security reasons, please change your password upon your first login.</p>
          
          <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
            <p style="font-size: 16px; margin-bottom: 4px;">Best Regards,</p>
            <p style="font-size: 16px; font-weight: bold; margin-top: 0;">The Admissions Team</p>
            <p style="font-size: 14px; color: #64748b;">${schoolName}</p>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: email, subject: `Admission Approved - ${studentName} (${schoolName})`, html });
  }

  async sendPaymentReceiptEmail(email: string, studentName: string, amount: string, reference: string, date: string, method: string, allocations: any[] = [], schoolName = 'School Management System'): Promise<boolean> {
    const html = `<p>Payment of ${amount} received for ${studentName}. Ref: ${reference}</p>`;
    return this.sendEmail({ to: email, subject: `Payment Receipt - ${schoolName}`, html });
  }

  async sendPaymentReminderEmail(email: string, studentName: string, balance: string, dueDate: string, message?: string, schoolName = 'School Management System'): Promise<boolean> {
    const html = `<p>Reminder: ward ${studentName} has balance ${balance}. Due: ${dueDate}</p>`;
    return this.sendEmail({ to: email, subject: `Payment Reminder - ${schoolName}`, html });
  }

  async sendNotificationEmail(email: string, subject: string, message: string, title: string, schoolName = 'School Management System'): Promise<boolean> {
    const html = `<h2>${title}</h2><p>${message}</p><hr/><p>${schoolName}</p>`;
    return this.sendEmail({ to: email, subject, html });
  }

  async sendPasswordChangedNotification(email: string, firstName: string, newPassword: string, schoolName = 'School Management System'): Promise<boolean> {
    const html = `<p>Hi ${firstName}, your password for ${schoolName} has been changed. New Password: ${newPassword}</p>`;
    return this.sendEmail({ to: email, subject: `Security Update - ${schoolName}`, html });
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetLink: string, schoolName = 'School Management System'): Promise<boolean> {
    const html = `<p>Hi ${firstName}, click here to reset your password: <a href="${resetLink}">Reset</a></p>`;
    return this.sendEmail({ to: email, subject: `Password Reset - ${schoolName}`, html });
  }

  async sendStaffWelcomeEmail(options: {
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    password: string;
    roleName?: string;
    schoolName?: string;
    portalUrl?: string;
  }): Promise<boolean> {
    const {
      email,
      firstName,
      lastName,
      employeeId,
      password,
      roleName = 'Staff',
      schoolName = 'School Management System',
      portalUrl = process.env.FRONTEND_URL || 'https://phjcschool.com.ng',
    } = options;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Welcome to ${schoolName}</h1>
          <p style="color: #99f6e4; margin: 8px 0 0 0; font-size: 16px;">Your staff account has been created</p>
        </div>
        
        <div style="padding: 32px; background: white;">
          <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${firstName} ${lastName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Your staff account has been successfully provisioned. You can now access the school management portal using the credentials below.</p>
          
          <div style="margin: 32px 0; padding: 24px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px;">
            <h3 style="margin-top: 0; color: #0f766e; font-size: 18px;">Your Login Credentials</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #64748b; width: 120px; font-size: 14px;">Employee ID:</td>
                <td style="padding: 10px 0; font-family: monospace; font-weight: bold; font-size: 14px;">${employeeId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Role:</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 14px;">${roleName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Login Email:</td>
                <td style="padding: 10px 0; font-family: monospace; font-weight: bold; font-size: 14px; background: #fff; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Password:</td>
                <td style="padding: 10px 0; font-family: monospace; font-weight: bold; font-size: 14px; background: #fff; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Portal URL:</td>
                <td style="padding: 10px 0;"><a href="${portalUrl}" style="color: #0f766e; text-decoration: none; font-weight: bold; font-size: 14px;">${portalUrl}</a></td>
              </tr>
            </table>
          </div>
          
          <div style="margin: 24px 0; padding: 16px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #854d0e;">
              <strong>⚠️ Important:</strong> For security reasons, you will be required to change your password upon your first login.
            </p>
          </div>
          
          <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
            <p style="font-size: 16px; margin-bottom: 4px;">Best Regards,</p>
            <p style="font-size: 16px; font-weight: bold; margin-top: 0;">HR Department</p>
            <p style="font-size: 14px; color: #64748b;">${schoolName}</p>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: email, subject: `Your Staff Account — ${schoolName}`, html });
  }
}
