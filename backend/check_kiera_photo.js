const { DataSource } = require('typeorm');
const path = require('path');

const dataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, 'sms.sqlite'),
    entities: [
        path.join(__dirname, 'src/modules/**/*.entity.ts'),
        path.join(__dirname, 'src/modules/**/*.entity.js')
    ],
    synchronize: false,
});

async function run() {
    try {
        await dataSource.initialize();
        console.log('Database connected.');

        // Get Student
        const students = await dataSource.query(`SELECT * FROM student WHERE first_name = 'Kiera' AND last_name = 'Rau'`);
        console.log('Student records:', students);

        if (students.length > 0) {
            const user = await dataSource.query(`SELECT * FROM "user" WHERE id = '${students[0].user_id}'`);
            console.log('User record:', user);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await dataSource.destroy();
    }
}

run();
