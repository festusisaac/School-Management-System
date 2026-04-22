import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Staff } from './src/modules/hr/entities/staff.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const staffRepository = app.get<Repository<Staff>>(getRepositoryToken(Staff));

    const email = 'croonshane@gmail.com';
    const tenantId = '186f9f4d-1298-4a99-b35a-1494d9f581a1';

    console.log(`Checking for staff with email: ${email}`);
    
    const staff = await staffRepository.find({
        where: [
            { email: email, tenantId },
            { email: email.toLowerCase(), tenantId },
            { email: email.toUpperCase(), tenantId }
        ]
    });

    console.log(`Found ${staff.length} records:`);
    console.log(JSON.stringify(staff, null, 2));

    await app.close();
}

bootstrap().catch(console.error);
