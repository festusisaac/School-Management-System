const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkOneClass() {
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
            SELECT c.id, c.name, s.name as section_name
            FROM classes c
            LEFT JOIN school_sections s ON s.id = c."schoolSectionId"
            WHERE c.id = 'c96c74b2-ef5a-43fb-a674-3285bafc46af'
        `);
        console.log('CLASS:', JSON.stringify(res.rows, null, 2));
        await client.end();
    } catch (e) {
        console.error(e.message);
    }
}

checkOneClass();
