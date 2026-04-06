const { DataSource } = require('typeorm');

async function repairStudentLinks() {
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

        // 1. Find students with NULL userId
        const students = await dataSource.query(`
            SELECT id, "admissionNo", "tenantId", "firstName", "lastName"
            FROM students
            WHERE "userId" IS NULL
        `);

        console.log(`Found ${students.length} students without userId.`);

        let linkedCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            const adm = student.admissionNo.toLowerCase().trim();
            
            // 2. Find matching user: try exact, ILIKE, or with @student.sms suffix
            const users = await dataSource.query(`
                SELECT id, email, role
                FROM users
                WHERE (email = $1 OR email = $2 OR email ILIKE $3)
                AND role = 'student' 
                AND "tenantId" = $4
            `, [student.admissionNo, `${adm}@student.sms`, adm, student.tenantId]);

            if (users.length > 0) {
                const user = users[0];
                // 3. Link them
                await dataSource.query(`
                    UPDATE students
                    SET "userId" = $1
                    WHERE id = $2
                `, [user.id, student.id]);

                console.log(`[LINKED] Student ${student.firstName} ${student.lastName} (${student.admissionNo}) -> User ${user.email}`);
                linkedCount++;
            } else {
                console.log(`[SKIPPED] No matching student user found for ${student.admissionNo}`);
                skippedCount++;
            }
        }

        console.log(`\nRepair Completed!`);
        console.log(`Total Linked: ${linkedCount}`);
        console.log(`Total Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Error Details:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

repairStudentLinks();
