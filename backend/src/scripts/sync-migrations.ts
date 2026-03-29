import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'sms_password',
  database: process.env.DATABASE_NAME || 'sms_db',
  schema: 'public'
});

const migrationStrings = [
    'CreateTimetableTables1734361234567',
    'CreateClassSubject1735203593000',
    'CreateSchoolSections1735210000000',
    'MakeSectionsOptional1735220000000',
    'InitialSchema1765504178965',
    'AddAcademics1765840417025',
    'RemoveSectionCapacity1765909019341',
    'RemoveSubjectCode1765913557296',
    'AddTimetableTables1765915583979',
    'AddMissingGeneralSettings1773905764237',
    'RemoveDesignation1774086000000',
    'CreateLibraryTables1775000000000',
    'CreateLibrarySettings1775000001000',
    'SeedLibraryPermissions1775000002000',
    'AddSessionIdToCoreTables1775100000000'
];

async function sync() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Connected to DB for sync');

        const existing = await AppDataSource.query('SELECT name FROM "migrations"');
        const existingNames = existing.map((m: any) => m.name);

        for (const name of migrationStrings) {
            if (!existingNames.includes(name)) {
                const timestamp = name.match(/\d+$/)?.[0];
                if (timestamp) {
                    await AppDataSource.query(
                        'INSERT INTO "migrations" (timestamp, name) VALUES ($1, $2)',
                        [timestamp, name]
                    );
                    console.log(`✓ Synchronized: ${name}`);
                }
            } else {
                console.log(`- Skipping (already present): ${name}`);
            }
        }

        await AppDataSource.destroy();
        console.log('\n--- Sync Complete ---');
    } catch (err) {
        console.error('× Sync failed:', err);
    }
}

sync();
