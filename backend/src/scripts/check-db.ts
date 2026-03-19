import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { SystemSetting } from '../modules/system/entities/system-setting.entity';
import { AcademicSession } from '../modules/system/entities/academic-session.entity';
import { AcademicTerm } from '../modules/system/entities/academic-term.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';

dotenv.config({ path: '.env' });

async function checkDatabase() {
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
                        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
                        database: process.env.DATABASE_NAME || 'sms_db',
                        entities: [SystemSetting, AcademicSession, AcademicTerm],
                        synchronize: false,
                    }),
                    inject: [ConfigService],
                }),
            ],
        }).compile();

        const dataSource = module.get(DataSource);
        let output = '';

        output += '--- SYSTEM SETTINGS ---\n';
        const settings = await dataSource.getRepository(SystemSetting).find();
        if (settings.length === 0) {
            output += 'No system settings found.\n';
        } else {
            const s = settings[0];
            output += `ID: ${s.id}\n`;
            output += `schoolName: ${s.schoolName}\n`;
            output += `currentSessionId: ${s.currentSessionId || 'NULL'}\n`;
            output += `currentTermId: ${s.currentTermId || 'NULL'}\n`;
        }

        output += '\n--- ACADEMIC SESSIONS ---\n';
        const sessions = await dataSource.getRepository(AcademicSession).find();
        sessions.forEach(sess => {
            output += `- ID: ${sess.id}, Name: ${sess.name}, Active: ${sess.isActive}\n`;
        });

        output += '\n--- ACADEMIC TERMS ---\n';
        const terms = await dataSource.getRepository(AcademicTerm).find();
        terms.forEach(t => {
            output += `- ID: ${t.id}, Name: ${t.name}, SessionID: ${t.sessionId}, Active: ${t.isActive}\n`;
        });

        fs.writeFileSync('db_check_result.txt', output);
        console.log('Results written to db_check_result.txt');

        await module.close();
        process.exit(0);
    } catch (error) {
        console.error('Error checking database:', error);
        process.exit(1);
    }
}

checkDatabase();
