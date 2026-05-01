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
import { seedPermissions } from '../../../database/seeds/permissions.seed';
import { seedRoles } from '../../../database/seeds/roles.seed';

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
      // 0. Seed Permissions and Roles first to ensure everything exists
      await seedPermissions(this.dataSource);
      await seedRoles(this.dataSource);

      // 1. Find Super Admin Role (Created by seedRoles)
      let superAdminRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'Super Administrator' },
      });

      if (!superAdminRole) {
          throw new InternalServerErrorException('Critical: Super Administrator role could not be initialized.');
      }

      // 2. Create or find the first Academic Session
      let savedSession = await queryRunner.manager.findOne(AcademicSession, {
        where: { name: dto.sessionName }
      });

      if (!savedSession) {
        const session = queryRunner.manager.create(AcademicSession, {
          name: dto.sessionName,
          isActive: true,
          startDate: new Date(dto.sessionStartDate),
          endDate: new Date(dto.sessionEndDate),
        });
        savedSession = await queryRunner.manager.save(session);
      }

      // 3. Create or find the first Academic Term
      let savedTerm = await queryRunner.manager.findOne(AcademicTerm, {
        where: { name: dto.termName, sessionId: savedSession.id }
      });

      if (!savedTerm) {
        const term = queryRunner.manager.create(AcademicTerm, {
          name: dto.termName,
          sessionId: savedSession.id,
          isActive: true,
          startDate: new Date(dto.termStartDate),
          endDate: new Date(dto.termEndDate),
        });
        savedTerm = await queryRunner.manager.save(term);
      }

      // 4. Create or find the first Super Admin User
      let adminUser = await queryRunner.manager.findOne(User, {
        where: { email: dto.adminEmail }
      });

      if (!adminUser) {
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
        const tenantId = uuidv4();
        adminUser = queryRunner.manager.create(User, {
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
      }

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
      await this.activityLogService.logAction({
        userEmail: dto.adminEmail,
        action: 'SYSTEM_INITIALIZATION',
        details: `System initialized was completed. Institutional Name: ${dto.schoolName}`,
        ipAddress: req.ip,
        portal: 'ADMIN',
      });

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
