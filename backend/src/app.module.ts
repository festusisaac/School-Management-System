import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaintenanceGuard } from './guards/maintenance.guard';

// Modules
import { AuthModule } from '@modules/auth/auth.module';
import { StudentsModule } from '@modules/students/students.module';
import { AcademicsModule } from '@modules/academics/academics.module';
import { FinanceModule } from '@modules/finance/finance.module';
import { LibraryModule } from '@modules/library/library.module';
import { DormitoryModule } from '@modules/dormitory/dormitory.module';
import { CommunicationModule } from '@modules/communication/communication.module';
import { ReportingModule } from '@modules/reporting/reporting.module';
import { BackupModule } from '@modules/backup/backup.module';
import { HrModule } from '@modules/hr/hr.module';
import { ExaminationModule } from '@modules/examination/examination.module';
import { SystemModule } from '@modules/system/system.module';
import { OnlineClassesModule } from '@modules/online-classes/online-classes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        synchronize: configService.get('DATABASE_SYNC') === 'true',
        logging: configService.get('DATABASE_LOGGING') === 'true',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB'),
        },
      }),
    }),

    // Feature Modules
    AuthModule,
    StudentsModule,
    AcademicsModule,
    FinanceModule,
    LibraryModule,
    DormitoryModule,
    CommunicationModule,
    ReportingModule,
    BackupModule,
    HrModule,
    ExaminationModule,
    SystemModule,
    OnlineClassesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
  ],
})
export class AppModule { }
