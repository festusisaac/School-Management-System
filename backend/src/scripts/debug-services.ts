import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { AcademicsService } from '../modules/academics/services/academics.service';
import { TimetableService } from '../modules/academics/services/timetable.service';
import { Class } from '../modules/academics/entities/class.entity';
import { Section } from '../modules/academics/entities/section.entity';
import { Subject } from '../modules/academics/entities/subject.entity';
import { SubjectGroup } from '../modules/academics/entities/subject-group.entity';
import { TimetablePeriod } from '../modules/academics/entities/timetable-period.entity';
import { Timetable } from '../modules/academics/entities/timetable.entity';

dotenv.config({ path: '.env' });

async function debugServices() {
    try {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot(),
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: () => ({
                        type: 'postgres',
                        host: process.env.DATABASE_HOST || 'localhost',
                        port: Number(process.env.DATABASE_PORT) || 5432,
                        username: process.env.DATABASE_USER || 'sms_user',
                        password: process.env.DATABASE_PASSWORD || 'sms_password',
                        database: process.env.DATABASE_NAME || 'sms_db',
                        entities: [Class, Section, Subject, SubjectGroup, TimetablePeriod, Timetable],
                        synchronize: false,
                    }),
                    inject: [ConfigService],
                }),
                TypeOrmModule.forFeature([Class, Section, Subject, SubjectGroup, TimetablePeriod, Timetable]),
            ],
            providers: [AcademicsService, TimetableService],
        }).compile();

        const academicsService = module.get<AcademicsService>(AcademicsService);
        const timetableService = module.get<TimetableService>(TimetableService);

        const tenantId = '4c961b88-e148-45ef-a8b1-e5117ccc43b5'; // Known tenantId

        console.log('Testing AcademicsService.getAllClasses...');
        const classes = await academicsService.getAllClasses(tenantId);
        console.log(`Success! Found ${classes.length} classes.`);

        console.log('Testing AcademicsService.getAllSubjects...');
        const subjects = await academicsService.getAllSubjects(tenantId);
        console.log(`Success! Found ${subjects.length} subjects.`);

        console.log('Testing TimetableService.getAllPeriods...');
        const periods = await timetableService.getAllPeriods(tenantId);
        console.log(`Success! Found ${periods.length} periods.`);

        console.log('All tests passed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during service testing:', error);
        process.exit(1);
    }
}

debugServices();
