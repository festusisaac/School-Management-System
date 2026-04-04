const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkPayrollCols() {
    const client = new Client({
        user: process.env.DATABASE_USER,
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payroll' 
            AND table_schema = 'public'
        `);
        console.log('PAYROLL COLUMNS:', JSON.stringify(res.rows, null, 2));
        await client.end();
    } catch (e) {
        console.error(e.message);
    }
}

checkPayrollCols();
