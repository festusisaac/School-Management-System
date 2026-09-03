import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Student } from '../modules/students/entities/student.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const studentsRepository = app.get<Repository<Student>>(getRepositoryToken(Student));

  const peters = await studentsRepository.createQueryBuilder('student')
    .where('student.firstName ILIKE :name', { name: '%peter%' })
    .orWhere('student.lastName ILIKE :name', { name: '%peter%' })
    .getMany();

  if (peters.length === 0) {
    console.log('No student named Peter found.');
  } else {
    for (const peter of peters) {
      console.log(`Found student: ${peter.firstName} ${peter.lastName} (ID: ${peter.id})`);
      try {
        await studentsRepository.delete(peter.id);
        console.log(`Deleted student ${peter.id}`);
      } catch (e) {
        console.error(`Failed to fully delete student ${peter.id}, attempting to deactivate instead. Error: ${(e as Error).message}`);
        peter.isActive = false;
        await studentsRepository.save(peter);
        console.log(`Deactivated student ${peter.id}`);
      }
    }
  }

  await app.close();
}

bootstrap();
