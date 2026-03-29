import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionIdToCoreTables1775100000000 implements MigrationInterface {
    name = 'AddSessionIdToCoreTables1775100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add sessionId to student_attendance
        await queryRunner.query(`ALTER TABLE "student_attendance" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "student_attendance" DROP CONSTRAINT IF EXISTS "FK_student_attendance_session"`);
        await queryRunner.query(`ALTER TABLE "student_attendance" ADD CONSTRAINT "FK_student_attendance_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 2. Add sessionId to homework
        await queryRunner.query(`ALTER TABLE "homework" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "homework" DROP CONSTRAINT IF EXISTS "FK_homework_session"`);
        await queryRunner.query(`ALTER TABLE "homework" ADD CONSTRAINT "FK_homework_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 3. Add sessionId to timetables
        await queryRunner.query(`ALTER TABLE "timetables" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "timetables" DROP CONSTRAINT IF EXISTS "FK_timetables_session"`);
        await queryRunner.query(`ALTER TABLE "timetables" ADD CONSTRAINT "FK_timetables_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 4. Add sessionId to exams
        await queryRunner.query(`ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "FK_exams_session"`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_exams_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 5. Add sessionId to exam_results
        await queryRunner.query(`ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "exam_results" DROP CONSTRAINT IF EXISTS "FK_exam_results_session"`);
        await queryRunner.query(`ALTER TABLE "exam_results" ADD CONSTRAINT "FK_exam_results_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 6. Add sessionId to exam_groups (proper FK alongside existing academicYear string)
        await queryRunner.query(`ALTER TABLE "exam_groups" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "exam_groups" DROP CONSTRAINT IF EXISTS "FK_exam_groups_session"`);
        await queryRunner.query(`ALTER TABLE "exam_groups" ADD CONSTRAINT "FK_exam_groups_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 7. Add sessionId to student_term_results
        await queryRunner.query(`ALTER TABLE "student_term_results" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "student_term_results" DROP CONSTRAINT IF EXISTS "FK_student_term_results_session"`);
        await queryRunner.query(`ALTER TABLE "student_term_results" ADD CONSTRAINT "FK_student_term_results_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 8. Add sessionId to transactions
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_transactions_session"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 9. Add sessionId to fee_assignments (proper FK alongside existing session string)
        await queryRunner.query(`ALTER TABLE "fee_assignments" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "fee_assignments" DROP CONSTRAINT IF EXISTS "FK_fee_assignments_session"`);
        await queryRunner.query(`ALTER TABLE "fee_assignments" ADD CONSTRAINT "FK_fee_assignments_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 10. Add sessionId to staff_attendance
        await queryRunner.query(`ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP CONSTRAINT IF EXISTS "FK_staff_attendance_session"`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" ADD CONSTRAINT "FK_staff_attendance_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 11. Add sessionId to carry_forwards
        await queryRunner.query(`ALTER TABLE "carry_forwards" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        await queryRunner.query(`ALTER TABLE "carry_forwards" DROP CONSTRAINT IF EXISTS "FK_carry_forwards_session"`);
        await queryRunner.query(`ALTER TABLE "carry_forwards" ADD CONSTRAINT "FK_carry_forwards_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);

        // 12. Add indexes for performance (using individual try-catch blocks or DROP IF EXISTS)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_attendance_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_student_attendance_sessionId" ON "student_attendance" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_homework_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_homework_sessionId" ON "homework" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_timetables_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_timetables_sessionId" ON "timetables" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exams_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_exams_sessionId" ON "exams" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_results_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_exam_results_sessionId" ON "exam_results" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_term_results_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_student_term_results_sessionId" ON "student_term_results" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_sessionId" ON "transactions" ("sessionId")`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_carry_forwards_sessionId"`);
        await queryRunner.query(`CREATE INDEX "IDX_carry_forwards_sessionId" ON "carry_forwards" ("sessionId")`);

        // 13. Backfill: Set all existing rows to the current active session
        await queryRunner.query(`
            UPDATE "student_attendance" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "homework" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "timetables" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "exams" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "exam_results" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "exam_groups" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "student_term_results" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "transactions" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "fee_assignments" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "staff_attendance" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "carry_forwards" SET "sessionId" = (SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1) WHERE "sessionId" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_attendance_sessionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_homework_sessionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_timetables_sessionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exams_sessionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_results_sessionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_term_results_sessionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_sessionId"`);

        // Drop FKs and columns
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP CONSTRAINT IF EXISTS "FK_staff_attendance_session"`);
        await queryRunner.query(`ALTER TABLE "staff_attendance" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "carry_forwards" DROP CONSTRAINT IF EXISTS "FK_carry_forwards_session"`);
        await queryRunner.query(`ALTER TABLE "carry_forwards" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "fee_assignments" DROP CONSTRAINT IF EXISTS "FK_fee_assignments_session"`);
        await queryRunner.query(`ALTER TABLE "fee_assignments" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_transactions_session"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "student_term_results" DROP CONSTRAINT IF EXISTS "FK_student_term_results_session"`);
        await queryRunner.query(`ALTER TABLE "student_term_results" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "exam_groups" DROP CONSTRAINT IF EXISTS "FK_exam_groups_session"`);
        await queryRunner.query(`ALTER TABLE "exam_groups" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "exam_results" DROP CONSTRAINT IF EXISTS "FK_exam_results_session"`);
        await queryRunner.query(`ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "FK_exams_session"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "timetables" DROP CONSTRAINT IF EXISTS "FK_timetables_session"`);
        await queryRunner.query(`ALTER TABLE "timetables" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "homework" DROP CONSTRAINT IF EXISTS "FK_homework_session"`);
        await queryRunner.query(`ALTER TABLE "homework" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "student_attendance" DROP CONSTRAINT IF EXISTS "FK_student_attendance_session"`);
        await queryRunner.query(`ALTER TABLE "student_attendance" DROP COLUMN IF EXISTS "sessionId"`);
    }
}
