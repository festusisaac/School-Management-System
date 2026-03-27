const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });

const AppDataSource = require('./data-source.ts').default;

async function run() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        // Get Student
        const students = await AppDataSource.query(`SELECT id, "firstName", "lastName", "studentPhoto", "userId" FROM "students" WHERE "firstName" = 'Kiera'`);
        console.log('Student records:', students);

        if (students.length > 0 && students[0].userId) {
            const user = await AppDataSource.query(`SELECT id, email, photo FROM "users" WHERE id = '${students[0].userId}'`);
            console.log('User record:', user);
            
            // Sync it manually for now to test if it fixes the sidebar issue
            if (user.length > 0 && students[0].studentPhoto && user[0].photo !== students[0].studentPhoto) {
                console.log('Syncing photo manually...');
                await AppDataSource.query(`UPDATE "users" SET photo = '${students[0].studentPhoto}' WHERE id = '${user[0].id}'`);
                console.log('Synced.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

run();
