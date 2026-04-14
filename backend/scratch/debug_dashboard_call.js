const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');
const { DashboardService } = require('../src/modules/reporting/services/dashboard.service');

async function debug() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(DashboardService);

    const userId = '41d42235-245b-45da-bc6a-282b37fcfb6f'; // Samuel Friday
    const tenantIdInput = '186f9f4d-1298-4a99-b35a-1494d9f581a1';
    const sessionId = 'b86384ba-4274-4271-a3ab-7140fcdca525'; // 2025/2026

    console.log('--- CALLING getParentDashboardOverview ---');
    try {
        const result = await service.getParentDashboardOverview(userId, tenantIdInput, sessionId);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
    await app.close();
}

debug();
