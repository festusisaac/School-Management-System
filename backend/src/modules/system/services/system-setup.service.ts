import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SystemSetting } from '../entities/system-setting.entity';
import { AcademicSession } from '../entities/academic-session.entity';
import { AcademicTerm } from '../entities/academic-term.entity';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';
import { InitializeSystemDto } from '../dtos/initialize-system.dto';
import { SystemSettingsService } from './system-settings.service';
import { ActivityLogService } from './activity-log.service';
import { Request } from 'express';

@Injectable()
export class SystemSetupService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(AcademicSession)
    private readonly sessionRepository: Repository<AcademicSession>,
    @InjectRepository(AcademicTerm)
    private readonly termRepository: Repository<AcademicTerm>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly activityLogService: ActivityLogService,
    private readonly dataSource: DataSource,
  ) {}

  async getSetupStatus(): Promise<{ isInitialized: boolean }> {
    const settings = await this.systemSettingsService.getSettings();
    return { isInitialized: settings.isInitialized };
  }

  async initializeSystem(
    dto: InitializeSystemDto,
    req: Request,
    logoFile?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const settings = await this.systemSettingsService.getSettings();

    if (settings.isInitialized) {
      throw new ConflictException('System is already initialized.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Super Admin Role if not exists
      let superAdminRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'Super Administrator' },
      });

      if (!superAdminRole) {
        superAdminRole = queryRunner.manager.create(Role, {
          name: 'Super Administrator',
          description: 'Global system administrator with full access.',
          isSystem: true,
        });
        superAdminRole = await queryRunner.manager.save(superAdminRole);
      }

      // 1b. Seed Standard Roles
      const standardRoles = [
        {
          name: 'Teacher',
          description: 'Teaching staff with access to academics, attendance, and student performance.',
          permissions: [
            'academics:view_timetable', 'students:view_directory', 'students:view_profile',
            'attendance:mark', 'attendance:view_history', 'homework:view', 'homework:create',
            'homework:evaluate', 'online_classes:manage', 'online_classes:history',
            'exams:enter_marks', 'exams:view_reports'
          ]
        },
        {
          name: 'Accountant',
          description: 'Financial officer responsible for fee collection and payroll.',
          permissions: [
            'finance:collect_fees', 'finance:view_payments', 'finance:view_reports',
            'finance:manage_fee_structure', 'hr:manage_payroll'
          ]
        },
        {
          name: 'Librarian',
          description: 'Manages school library, books, and circulation.',
          permissions: [
            'library:view_books', 'library:manage_books', 'library:issue_return', 'library:view_reports'
          ]
        },
        {
          name: 'Registrar',
          description: 'Administrative officer for student admissions and records.',
          permissions: [
            'academics:manage_classes', 'academics:manage_subjects', 'academics:assign_teachers',
            'students:view_directory', 'students:view_profile', 'students:create', 'students:edit',
            'students:manage_categories', 'hr:manage_staff', 'hr:manage_departments'
          ]
        },
        {
          name: 'Admin',
          description: 'School administrator with broad oversight of academics, students, and human resources.',
          permissions: [
            'settings:general', 'settings:academic_setup',
            'academics:manage_classes', 'academics:manage_subjects', 'academics:assign_teachers',
            'academics:view_timetable', 'academics:manage_timetable', 'academics:promote_students',
            'students:view_directory', 'students:view_profile', 'students:create', 'students:edit',
            'students:manage_categories', 'hr:manage_staff', 'hr:manage_departments', 'hr:manage_attendance',
            'hr:manage_payroll', 'hr:manage_leave', 'attendance:mark', 'attendance:view_history',
            'attendance:view_reports', 'homework:view', 'homework:create', 'homework:evaluate',
            'online_classes:manage', 'online_classes:history', 'library:view_books', 'library:manage_books',
            'library:issue_return', 'library:view_reports', 'finance:collect_fees', 'finance:view_payments',
            'finance:view_reports', 'finance:manage_fee_structure', 'finance:manage_reminders',
            'exams:manage_setup', 'exams:manage_schedule', 'exams:manage_admit_cards', 'exams:enter_marks',
            'exams:manage_domains', 'exams:view_reports', 'exams:process_results'
          ]
        }
      ];

      for (const roleDef of standardRoles) {
        let role = await queryRunner.manager.findOne(Role, { where: { name: roleDef.name } });
        if (!role) {
          const permissions = await queryRunner.manager.find(Permission, {
            where: roleDef.permissions.map(slug => ({ slug }))
          });
          role = queryRunner.manager.create(Role, {
            name: roleDef.name,
            description: roleDef.description,
            isSystem: false,
            permissions: permissions
          });
          await queryRunner.manager.save(role);
        }
      }

      // 2. Create the first Academic Session
      const session = queryRunner.manager.create(AcademicSession, {
        name: dto.sessionName,
        isActive: true,
        startDate: new Date(dto.sessionStartDate),
        endDate: new Date(dto.sessionEndDate),
      });
      const savedSession = await queryRunner.manager.save(session);

      // 3. Create the first Academic Term
      const term = queryRunner.manager.create(AcademicTerm, {
        name: dto.termName,
        sessionId: savedSession.id,
        isActive: true,
        startDate: new Date(dto.termStartDate),
        endDate: new Date(dto.termEndDate),
      });
      const savedTerm = await queryRunner.manager.save(term);

      // 4. Create the first Super Admin User
      const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
      const tenantId = uuidv4();
      const adminUser = queryRunner.manager.create(User, {
        firstName: dto.adminFirstName,
        lastName: dto.adminLastName,
        email: dto.adminEmail,
        password: hashedPassword,
        roleId: superAdminRole.id,
        role: 'Super Administrator',
        tenantId: tenantId,
        isActive: true,
      });
      await queryRunner.manager.save(adminUser);

      // 5. Update System Settings
      settings.schoolName = dto.schoolName;
      settings.schoolMotto = dto.schoolMotto || settings.schoolMotto;
      settings.schoolAddress = dto.schoolAddress;
      settings.schoolEmail = dto.schoolEmail;
      settings.schoolPhone = dto.schoolPhone;
      settings.officialWebsite = dto.officialWebsite || settings.officialWebsite;
      settings.whatsappNumber = dto.whatsappNumber || settings.whatsappNumber;
      settings.timezone = dto.timezone || settings.timezone;
      settings.dateFormat = dto.dateFormat || settings.dateFormat;
      settings.admissionNumberPrefix = dto.admissionNumberPrefix || settings.admissionNumberPrefix;
      settings.staffIdPrefix = dto.staffIdPrefix || settings.staffIdPrefix;
      settings.currentSessionId = savedSession.id;
      settings.currentTermId = savedTerm.id;
      settings.isInitialized = true;

      if (logoFile) {
        settings.primaryLogo = `uploads/logos/${logoFile.filename}`;
      }

      await queryRunner.manager.save(settings);

      // 6. Log Initialization Action
      await this.activityLogService.logAction(
        dto.adminEmail,
        'SYSTEM_INITIALIZATION',
        `System initialized was completed. Institutional Name: ${dto.schoolName}`,
        req.ip
      );

      await queryRunner.commitTransaction();
      return { message: 'System initialized successfully.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('System initialization error:', error);
      throw new InternalServerErrorException('Failed to initialize system.');
    } finally {
      await queryRunner.release();
    }
  }
}
