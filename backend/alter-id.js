const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

async function run() {
  await client.connect();
  try {
    console.log('Altering transactions id column...');
    await client.query('ALTER TABLE transactions ALTER COLUMN id TYPE varchar(36) USING id::varchar;');
    console.log('Successfully altered transactions id column to varchar(36)');
  } catch (err) {
    console.error('Error altering column:', err);
  } finally {
    await client.end();
  }
}

run();
