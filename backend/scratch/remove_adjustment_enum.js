const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const c = new Client({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME
    });
    await c.connect();

    try {
        await c.query('BEGIN');

        // Rename old enum
        await c.query('ALTER TYPE transactions_type_enum RENAME TO transactions_type_enum_old');
        
        // Create new enum without ADJUSTMENT
        await c.query("CREATE TYPE transactions_type_enum AS ENUM ('FEE_PAYMENT', 'REFUND', 'WAIVER', 'CARRY_FORWARD')");
        
        // Drop default, alter the column type, restore
        await c.query('ALTER TABLE transactions ALTER COLUMN type DROP DEFAULT');
        await c.query('ALTER TABLE transactions ALTER COLUMN type TYPE transactions_type_enum USING type::text::transactions_type_enum');
        
        // Drop old enum
        await c.query('DROP TYPE transactions_type_enum_old');
        
        await c.query('COMMIT');
        console.log('✅ ADJUSTMENT removed from PostgreSQL enum.');
        console.log('Valid types are now: FEE_PAYMENT, REFUND, WAIVER, CARRY_FORWARD');
    } catch (e) {
        await c.query('ROLLBACK');
        console.error('❌ Failed:', e.message);
    }

    await c.end();
}
run().catch(console.error);
