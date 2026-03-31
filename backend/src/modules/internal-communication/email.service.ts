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

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.emailQueue.add('send-mail', options, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
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
}
