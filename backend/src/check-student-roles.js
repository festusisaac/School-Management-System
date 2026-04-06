const { DataSource } = require('typeorm');
const path = require('path');

async function checkStudents() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db',
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('Database connected');

        const students = await dataSource.query(`
            SELECT s.id, s."firstName", s."lastName", s."userId", u.email, u.role, s."tenantId"
            FROM students s
            LEFT JOIN users u ON s."userId" = u.id
            LIMIT 10
        `);

        console.log('Recent Students:');
        console.table(students);

        const roles = await dataSource.query(`SELECT DISTINCT role FROM users`);
        console.log('Distinct Roles in Users table:', roles);

    } catch (error) {
        console.error('Error Details:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

checkStudents();
