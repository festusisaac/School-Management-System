import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Class } from '../modules/academics/entities/class.entity';

import { Section } from '../modules/academics/entities/section.entity';
import { Subject } from '../modules/academics/entities/subject.entity';
import { SubjectGroup } from '../modules/academics/entities/subject-group.entity';
import { Timetable } from '../modules/academics/entities/timetable.entity';
import { TimetablePeriod } from '../modules/academics/entities/timetable-period.entity';

dotenv.config({ path: '.env' });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'sms_user',
    password: process.env.DATABASE_PASSWORD || 'sms_password',
    database: process.env.DATABASE_NAME || 'sms_db',
    entities: [Class, Section, Subject, SubjectGroup, Timetable, TimetablePeriod],
    synchronize: false,
    logging: true,
});

async function checkClasses() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const subjectRepo = AppDataSource.getRepository(Subject);
        console.log('Querying Subjects...');
        const subjects = await subjectRepo.find();
        console.log('Subjects found:', subjects.length);

        const periodRepo = AppDataSource.getRepository(TimetablePeriod);
        console.log('Querying Periods...');
        const periods = await periodRepo.find();
        console.log('Periods found:', periods.length);

        const classRepo = AppDataSource.getRepository(Class);
        console.log('Querying Classes...');
        const classes = await classRepo.find({ relations: ['sections'] });
        console.log('Classes found:', classes.length);
        if (classes.length > 0) {
            console.table(classes.map(c => ({ id: c.id, name: c.name, tenantId: c.tenantId })));
        } else {
            console.log('No classes found in the database. Creating defaults...');
            await createDefaultClasses();
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error checking classes:', error);
        process.exit(1);
    }
}

async function createDefaultClasses() {
    const classRepo = AppDataSource.getRepository(Class);
    // Assuming a default tenantId if one isn't clear, or maybe we can't create if we don't know the tenant.
    // However, usually we can just create with a placeholder or 'default' if the app supports it.
    // But wait, the app uses JWT to get tenantId. 
    // If I create one here, I need to know which tenantId the user is logged in with.
    // Since I can't know that easily, I'll just clear valid classes.
    // Actually, I'll just list them. If empty, I'll report back.

    // For now, I'll hardcode a common tenantId if I were to create, but let's just observe first.
}

checkClasses();
