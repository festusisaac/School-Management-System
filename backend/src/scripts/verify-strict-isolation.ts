import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StudentsService } from '../modules/students/services/students.service';
import { SystemSettingsService } from '../modules/system/services/system-settings.service';
import { DataSource } from 'typeorm';

async function verifyStrictIsolation() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const studentsService = app.get(StudentsService);
  const settingsService = app.get(SystemSettingsService);
  const dataSource = app.get(DataSource);

  try {
    console.log('✓ App context initialized');

    // 1. Setup Test Data
    const student = await dataSource.query('SELECT id, "tenantId" FROM students LIMIT 1');
    const sessions = await dataSource.query('SELECT id, name FROM academic_sessions LIMIT 2');
    
    if (student.length === 0 || sessions.length < 2) {
      console.log('! Insufficient data to test.');
      return;
    }

    const sid = student[0].id;
    const tid = student[0].tenantId;
    const sessA = sessions[0].id;
    const sessB = sessions[1].id;

    console.log(`Testing with Student: ${sid}`);
    console.log(`Session A (Active): ${sessions[0].name} (${sessA})`);
    console.log(`Session B (Inactive): ${sessions[1].name} (${sessB})`);

    // 2. Insert records for both sessions
    await dataSource.query('DELETE FROM student_attendance WHERE "studentId" = $1 AND date IN ($2, $3)', [sid, '2026-03-01', '2026-03-02']);
    
    // Get class and section
    const s = await dataSource.query('SELECT "classId", "sectionId" FROM students WHERE id = $1', [sid]);
    const cid = s[0].classId;
    const secId = s[0].sectionId;

    await dataSource.query('INSERT INTO student_attendance (id, "studentId", "classId", "sectionId", date, status, "tenantId", "sessionId") VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)', 
        [sid, cid, secId, '2026-03-01', 'present', tid, sessA]);
    await dataSource.query('INSERT INTO student_attendance (id, "studentId", "classId", "sectionId", date, status, "tenantId", "sessionId") VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)', 
        [sid, cid, secId, '2026-03-02', 'present', tid, sessB]);

    // 3. Set Session A as active globally
    await settingsService.updateSettings({ currentSessionId: sessA });

    // 4. Call Service Method
    const results = await studentsService.getStudentAttendance(sid, '2026-03-01', '2026-03-30', tid);
    
    console.log('\nService Results (Should only find Session A):');
    results.forEach(r => console.log(`Date: ${r.date}, Session: ${r.sessionId}`));

    const allCorrect = results.every(r => r.sessionId === sessA);
    const countCorrect = results.length === 1;

    if (allCorrect && countCorrect) {
      console.log('\n✓ STRICT SESSION ISOLATION VERIFIED');
    } else {
      console.error('\n× FAILED: Found cross-session data or no data.');
      console.log(`Found ${results.length} records. Expected 1.`);
    }

    // Cleanup
    await dataSource.query('DELETE FROM student_attendance WHERE "studentId" = $1 AND date IN ($2, $3)', [sid, '2026-03-01', '2026-03-02']);

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await app.close();
  }
}

verifyStrictIsolation();
