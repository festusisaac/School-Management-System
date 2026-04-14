
import { createConnection } from 'typeorm';
import { AcademicSession } from './src/modules/system/entities/academic-session.entity';
import { CarryForward } from './src/modules/finance/entities/carry-forward.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
    const connection = await createConnection({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER || 'sms_user',
        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
        database: process.env.DATABASE_NAME || 'sms_db',
        entities: [AcademicSession, CarryForward],
        synchronize: false,
    });

    try {
        console.log('--- Academic Sessions ---');
        const sessions = await connection.getRepository(AcademicSession).find();
        sessions.forEach(s => console.log(`ID: ${s.id}, Name: "${s.name}"`));

        console.log('\n--- Recent Carry Forwards ---');
        const cfs = await connection.getRepository(CarryForward).find({ 
            order: { createdAt: 'DESC' },
            take: 5
        });
        if (cfs.length === 0) {
            console.log('No carry forward records found!');
        } else {
            cfs.forEach(cf => console.log(`ID: ${cf.id}, Student: ${cf.studentId}, SessionID: ${cf.sessionId}, Amount: ${cf.amount}, Year: ${cf.academicYear}`));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await connection.close();
    }
}

diagnose();
