import { DataSource } from 'typeorm';
import { SystemSetting } from '../modules/system/entities/system-setting.entity';
import { AcademicSession } from '../modules/system/entities/academic-session.entity';
import { AcademicTerm } from '../modules/system/entities/academic-term.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function populateActiveSettings() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sms_db',
    entities: [SystemSetting, AcademicSession, AcademicTerm],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    const systemSettingRepository = dataSource.getRepository(SystemSetting);
    const sessionRepository = dataSource.getRepository(AcademicSession);
    const termRepository = dataSource.getRepository(AcademicTerm);

    // Get the first system setting record
    const settings = await systemSettingRepository.findOne({ where: {} });
    if (!settings) {
      console.log('No system settings found to update.');
      return;
    }

    // Identifiers from previous check
    const sessionId = 'b86384ba-4274-4271-a3ab-7140fcdca525'; // 2025/2026
    const termId = 'd5bb2496-ef26-48a8-b1de-3349e746e923';    // First Term

    const session = await sessionRepository.findOne({ where: { id: sessionId } });
    const term = await termRepository.findOne({ where: { id: termId } });

    if (!session || !term) {
      console.log('Session or Term not found with the specified IDs.');
      console.log('Session found:', !!session);
      console.log('Term found:', !!term);
      return;
    }

    settings.currentSessionId = sessionId;
    settings.currentTermId = termId;

    await systemSettingRepository.save(settings);
    console.log('Successfully updated system settings with active session and term.');
    console.log(`Session: ${session.name} (${sessionId})`);
    console.log(`Term: ${term.name} (${termId})`);

  } catch (err) {
    console.error('Error during database update:', err);
  } finally {
    await dataSource.destroy();
  }
}

populateActiveSettings();
