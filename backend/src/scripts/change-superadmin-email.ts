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
  schema: 'public',
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
});

async function changeEmail() {
    const newEmail = process.argv[2];
    const oldEmail = process.argv[3]; // Optional

    if (!newEmail) {
        console.error('Usage: ts-node change-superadmin-email.ts <new_email> [old_email]');
        console.error('Example: ts-node change-superadmin-email.ts newadmin@school.com');
        process.exit(1);
    }

    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected');

        let query = `SELECT id, email, "firstName", "lastName", role FROM "users" WHERE "role" ILIKE '%super administrator%'`;
        const params: any[] = [];

        if (oldEmail) {
            query += ` AND email = $1`;
            params.push(oldEmail);
        }

        const superAdmins = await AppDataSource.query(query, params);

        if (superAdmins.length === 0) {
            console.error('× No Super Administrator found' + (oldEmail ? ` with email ${oldEmail}` : ''));
            process.exit(1);
        }

        if (superAdmins.length > 1 && !oldEmail) {
            console.error('× Multiple Super Administrators found. Please specify the old email to update.');
            console.table(superAdmins.map((admin: any) => ({
                id: admin.id,
                email: admin.email,
                name: `${admin.firstName} ${admin.lastName}`
            })));
            console.error('Usage: ts-node change-superadmin-email.ts <new_email> <old_email>');
            process.exit(1);
        }

        const adminToUpdate = superAdmins[0];

        // Check if the new email already exists
        const existingUser = await AppDataSource.query(`SELECT id FROM "users" WHERE email = $1`, [newEmail]);
        if (existingUser.length > 0) {
            console.error(`× A user with the email ${newEmail} already exists!`);
            process.exit(1);
        }

        // Update the email
        await AppDataSource.query(`UPDATE "users" SET email = $1 WHERE id = $2`, [newEmail, adminToUpdate.id]);

        console.log(`✓ Successfully updated Super Administrator email!`);
        console.log(`  Old Email: ${adminToUpdate.email}`);
        console.log(`  New Email: ${newEmail}`);

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Failed to update email:', err);
        process.exit(1);
    }
}

changeEmail();
