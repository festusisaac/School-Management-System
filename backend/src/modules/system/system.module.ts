import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicTerm } from './entities/academic-term.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { SystemSettingsService } from './services/system-settings.service';
import { AcademicSessionsService } from './services/academic-sessions.service';
import { AcademicTermsService } from './services/academic-terms.service';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { AcademicSessionsController } from './controllers/academic-sessions.controller';
import { AcademicTermsController } from './controllers/academic-terms.controller';
import { RolesPermissionsController } from './controllers/roles-permissions.controller';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { RolesPermissionsService } from './services/roles-permissions.service';
import { ActivityLogService } from './services/activity-log.service';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SystemSetupController } from './controllers/system-setup.controller';
import { SystemSetupService } from './services/system-setup.service';
import { CommunicationModule } from '../communication/communication.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemSetting,
            AcademicSession,
            AcademicTerm,
            ActivityLog,
            Role,
            Permission,
            User,
        ]),
        forwardRef(() => AuthModule),
        forwardRef(() => CommunicationModule),
    ],
    controllers: [
        SystemSettingsController,
        AcademicSessionsController,
        AcademicTermsController,
        RolesPermissionsController,
        UsersController,
        SystemSetupController,
    ],
    providers: [
        SystemSettingsService,
        AcademicSessionsService,
        AcademicTermsService,
        RolesPermissionsService,
        ActivityLogService,
        UsersService,
        SystemSetupService,
    ],
    exports: [
        SystemSettingsService,
        AcademicSessionsService,
        AcademicTermsService,
        RolesPermissionsService,
        ActivityLogService,
        UsersService,
        SystemSetupService,
    ],
})
export class SystemModule { }
