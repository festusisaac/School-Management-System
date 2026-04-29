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
    parentPassword?: string;
    studentPassword?: string;
    schoolName?: string;
    portalUrl?: string;
    admissionLetterHtml?: string;
    isNewUser?: boolean;
    isOnline?: boolean;
  }): Promise<boolean> {
    const {
      email,
      guardianName,
      studentName,
      admissionNo,
      parentUsername,
      parentPassword,
      studentPassword,
      schoolName = 'Our School',
      admissionLetterHtml,
      isNewUser = true,
      isOnline = false
    } = options;

    // Robust Portal URL resolution
    const portalUrl = options.portalUrl || process.env.FRONTEND_URL || 'https://phjcschool.com.ng';

    const mainContent = admissionLetterHtml || `
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${guardianName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">We are pleased to inform you that the admission for <strong>${studentName}</strong> (Admission No: ${admissionNo}) has been successfully processed and approved.</p>
      <p style="font-size: 16px; line-height: 1.6;">Welcome to our academic community. We look forward to a successful educational journey with your ward.</p>
    `;

    let credentialsSection = '';

    if (isOnline) {
      credentialsSection = `
          <!-- Bulletproof Table Button -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: auto;">
            <tr>
              <td style="border-radius: 8px; background: #0284c7; text-align: center;">
                <a href="${portalUrl}/admission/status" target="_blank" style="background: #0284c7; border: 12px solid #0284c7; font-family: sans-serif; font-size: 16px; line-height: 1.1; text-decoration: none; padding: 0 20px; color: #ffffff; display: block; border-radius: 8px; font-weight: bold;">
                  Check Status & Print Letter
                </a>
              </td>
            </tr>
          </table>
          <p style="margin-top: 16px; font-size: 12px; color: #64748b; font-family: sans-serif;">
            Link not working? Copy and paste this into your browser:<br/>
            <a href="${portalUrl}/admission/status" style="color: #0284c7; text-decoration: underline;">${portalUrl}/admission/status</a>
          </p>
        </div>
      `;
    } else {
      credentialsSection = `
        <div style="margin: 32px 0; padding: 24px; background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px;">
          <h3 style="margin-top: 0; color: #2563eb; font-size: 18px; font-family: sans-serif;">Portal Access Credentials</h3>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 20px; font-family: sans-serif;">Use the credentials below to access your school portal. For security, you will be required to change these passwords on your first login.</p>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
            <!-- Parent Section -->
            <tr><td colspan="2" style="padding: 8px 0; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">Parent Account</td></tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 100px; font-size: 13px; font-family: sans-serif;">Username:</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${parentUsername}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-family: sans-serif;">Password:</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${isNewUser ? parentPassword : 'Use your existing password'}</td>
            </tr>
            
            <!-- Student Section -->
            <tr><td colspan="2" style="padding: 16px 0 8px 0; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">Student Account</td></tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-family: sans-serif;">Username:</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${admissionNo}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-family: sans-serif;">Password:</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${studentPassword}</td>
            </tr>
            
            <tr>
              <td style="padding: 16px 0 8px 0; color: #64748b; font-size: 13px; font-family: sans-serif; width: 100px;">Portal URL:</td>
              <td style="padding: 16px 0 8px 0;"><a href="${portalUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold; font-family: sans-serif;">${portalUrl}</a></td>
            </tr>
          </table>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Admission Approved</title>
        <style>
          html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; background-color: #f8fafc; }
          * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
          div[style*="margin: 16px 0"] { margin: 0 !important; }
          table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
          table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
          img { -ms-interpolation-mode:bicubic; }
          a { text-decoration: none; }
        </style>
      </head>
      <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f8fafc;">
        <center style="width: 100%; background-color: #f8fafc; padding-top: 40px; padding-bottom: 40px;">
          <div style="max-width: 600px; margin: 0 auto;" class="email-container">
            <!--[if mso]>
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
            <td>
            <![endif]-->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background-color: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: sans-serif; font-weight: bold; letter-spacing: -0.5px;">Student Admission Approved</h1>
                  <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px; font-family: sans-serif;">Welcome to ${schoolName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; color: #1e293b; font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                  ${mainContent}
                  
                  ${credentialsSection}
 
                  <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                    <p style="font-size: 16px; margin-bottom: 4px; font-family: sans-serif;">Best Regards,</p>
                    <p style="font-size: 16px; font-weight: bold; margin-top: 0; font-family: sans-serif;">The Admissions Team</p>
                    <p style="font-size: 14px; color: #64748b; font-family: sans-serif;">${schoolName}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; font-family: sans-serif; font-size: 12px; color: #94a3b8;">
                  This is an automated message. Please do not reply directly to this email.
                </td>
              </tr>
            </table>
            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </div>
        </center>
      </body>
      </html>
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
    } = options;

    const portalUrl = options.portalUrl || process.env.FRONTEND_URL || 'https://phjcschool.com.ng';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Welcome to the Team</title>
        <style>
          html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; background-color: #f8fafc; }
          * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
          div[style*="margin: 16px 0"] { margin: 0 !important; }
          table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
          table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
          img { -ms-interpolation-mode:bicubic; }
          a { text-decoration: none; }
        </style>
      </head>
      <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f8fafc;">
        <center style="width: 100%; background-color: #f8fafc; padding-top: 40px; padding-bottom: 40px;">
          <div style="max-width: 600px; margin: 0 auto;" class="email-container">
            <!--[if mso]>
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
            <td>
            <![endif]-->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background-color: #0f766e; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: sans-serif; font-weight: bold; letter-spacing: -0.5px;">Welcome to ${schoolName}</h1>
                  <p style="color: #99f6e4; margin: 8px 0 0 0; font-size: 16px; font-family: sans-serif;">Your staff account has been created</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; color: #1e293b; font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                  <p style="margin-bottom: 20px;">Dear <strong>${firstName} ${lastName}</strong>,</p>
                  <p>Your staff account has been successfully provisioned. You can now access the school management portal using the credentials below.</p>
                  
                  <div style="margin: 32px 0; padding: 24px; background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px;">
                    <h3 style="margin-top: 0; color: #0f766e; font-size: 18px; font-family: sans-serif;">Your Login Credentials</h3>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; width: 120px; font-size: 14px; font-family: sans-serif;">Employee ID:</td>
                        <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${employeeId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-family: sans-serif;">Role:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${roleName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-family: sans-serif;">Login Email:</td>
                        <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-family: sans-serif;">Password:</td>
                        <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #1e293b;">${password}</td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 8px 0; color: #64748b; font-size: 14px; font-family: sans-serif; width: 120px;">Portal Access:</td>
                        <td style="padding: 16px 0 8px 0;">
                          <!-- Bulletproof Button -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0;">
                            <tr>
                              <td style="border-radius: 6px; background: #0f766e; text-align: center;">
                                <a href="${portalUrl}" target="_blank" style="background: #0f766e; border: 10px solid #0f766e; font-family: sans-serif; font-size: 14px; line-height: 1.1; text-decoration: none; padding: 0 15px; color: #ffffff; display: block; border-radius: 6px; font-weight: bold;">
                                  Login to Portal
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="margin: 24px 0; padding: 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #854d0e; font-family: sans-serif;">
                      <strong>⚠️ Important:</strong> For security reasons, you will be required to change your password upon your first login.
                    </p>
                  </div>
                  
                  <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                    <p style="font-size: 16px; margin-bottom: 4px; font-family: sans-serif;">Best Regards,</p>
                    <p style="font-size: 16px; font-weight: bold; margin-top: 0; font-family: sans-serif;">HR Department</p>
                    <p style="font-size: 14px; color: #64748b; font-family: sans-serif;">${schoolName}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; font-family: sans-serif; font-size: 12px; color: #94a3b8;">
                  This is an automated message. Please do not reply directly to this email.
                </td>
              </tr>
            </table>
            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </div>
        </center>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject: `Your Staff Account — ${schoolName}`, html });
  }
}
