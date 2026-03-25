const { DataSource } = require('typeorm');

async function main() {
    const ds = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'your_secure_password',
        database: 'sms_db',
    });
    
    await ds.initialize();
    
    const allFks = await ds.query(
        "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'scratch_cards'::regclass AND contype = 'f'"
    );
    console.log('All scratch_cards FKs:');
    allFks.forEach(fk => console.log(fk.conname, ':', fk.pg_get_constraintdef));
    
    await ds.destroy();
}

main().catch(e => console.error(e));
