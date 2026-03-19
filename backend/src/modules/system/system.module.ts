import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicTerm } from './entities/academic-term.entity';
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
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemSetting,
            AcademicSession,
            AcademicTerm,
            Role,
            Permission,
        ]),
        forwardRef(() => AuthModule),
    ],
    controllers: [
        SystemSettingsController,
        AcademicSessionsController,
        AcademicTermsController,
        RolesPermissionsController,
    ],
    providers: [
        SystemSettingsService,
        AcademicSessionsService,
        AcademicTermsService,
        RolesPermissionsService,
    ],
    exports: [
        SystemSettingsService,
        AcademicSessionsService,
        AcademicTermsService,
        RolesPermissionsService,
    ],
})
export class SystemModule { }
