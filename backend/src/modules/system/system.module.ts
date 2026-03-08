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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemSetting,
            AcademicSession,
            AcademicTerm,
        ]),
    ],
    controllers: [
        SystemSettingsController,
        AcademicSessionsController,
        AcademicTermsController,
    ],
    providers: [
        SystemSettingsService,
        AcademicSessionsService,
        AcademicTermsService,
    ],
    exports: [
        SystemSettingsService,
        AcademicSessionsService,
        AcademicTermsService,
    ],
})
export class SystemModule { }
