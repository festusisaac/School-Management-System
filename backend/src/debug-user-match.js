const { DataSource } = require('typeorm');

async function debugUserMatch() {
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

        const admissionNo = 'PHJCS/2026/0022';
        console.log(`Searching for users related to: ${admissionNo}`);

        const users = await dataSource.query(`
            SELECT id, email, role, "tenantId"
            FROM users
            WHERE email ILIKE $1 OR email ILIKE $2
        `, [`%${admissionNo}%`, `%2026/0022%`]);

        console.table(users);

        const allStudentUsers = await dataSource.query(`
            SELECT id, email, role, "tenantId"
            FROM users
            WHERE role = 'student'
            LIMIT 10
        `);
        console.log('Sample of student users in DB:');
        console.table(allStudentUsers);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

debugUserMatch();
