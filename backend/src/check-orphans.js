const { DataSource } = require('typeorm');

async function checkOrphanedUsers() {
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

        // Find users with role 'student' who are NOT linked in students table
        const orphanedStudents = await dataSource.query(`
            SELECT u.id, u.email, u.role
            FROM users u
            WHERE u.role = 'student'
            AND u.id NOT IN (SELECT "userId" FROM students WHERE "userId" IS NOT NULL)
        `);

        console.log('Users with role student but NO student record linked:');
        console.table(orphanedStudents);

        // Find students with NO userId
        const studentsWithoutUser = await dataSource.query(`
            SELECT s.id, s."firstName", s."lastName", s."admissionNo", s."tenantId"
            FROM students s
            WHERE s."userId" IS NULL
        `);

        console.log('Students with NO userId:');
        console.table(studentsWithoutUser);

    } catch (error) {
        console.error('Error Details:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

checkOrphanedUsers();
