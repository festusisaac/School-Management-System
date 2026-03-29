import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StudentsService } from '../modules/students/services/students.service';
import { DataSource } from 'typeorm';

async function simPortalCall() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const studentsService = app.get(StudentsService);
  const dataSource = app.get(DataSource);

  try {
    // 1. Get the userId of the student we saw in Record 0
    const studentInfo = await dataSource.query('SELECT "userId", id, "firstName", "tenantId" FROM students WHERE id = $1', ['a351a4b6-f174-4f3e-beac-148f486d594b']);
    if (studentInfo.length === 0) {
      console.log('! Student not found.');
      return;
    }
    const { userId, id, firstName, tenantId } = studentInfo[0];
    console.log(`Simulating call for Student: ${firstName} (ID: ${id}, UserID: ${userId})`);

    // 2. Call the service as the portal would (using userId)
    // Date range for March 2026
    const start = '2026-03-01';
    const end = '2026-03-31';
    
    console.log(`Calling getStudentAttendance for range ${start} to ${end}...`);
    const results = await studentsService.getStudentAttendance(userId, start, end, tenantId);
    
    console.log(`\nResults Found: ${results.length}`);
    results.forEach(r => {
        console.log(`- Date: ${r.date}, Status: ${r.status}, Session: ${r.sessionId}`);
    });

  } catch (err) {
    console.error('× Simulation failed:', err);
  } finally {
    await app.close();
  }
}

simPortalCall();
