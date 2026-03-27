const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });

const AppDataSource = require('./data-source.ts').default;

async function run() {
    try {
        await AppDataSource.initialize();
        const permissions = await AppDataSource.query(`SELECT slug, module FROM "permissions"`);
        console.log('Permissions:');
        console.log(permissions);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

run();
