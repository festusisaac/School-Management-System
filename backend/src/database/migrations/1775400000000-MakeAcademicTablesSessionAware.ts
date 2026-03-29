import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeAcademicTablesSessionAware1775400000000 implements MigrationInterface {
    name = 'MakeAcademicTablesSessionAware1775400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Get current session ID for backfill
        const system = await queryRunner.query('SELECT "currentSessionId" FROM "system_settings" LIMIT 1');
        const activeSessId = (system.length > 0 && system[0].currentSessionId) ? system[0].currentSessionId : null;

        // --- Class Subject ---
        await queryRunner.query(`ALTER TABLE "class_subject" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        if (activeSessId) {
            await queryRunner.query(`UPDATE "class_subject" SET "sessionId" = $1 WHERE "sessionId" IS NULL`, [activeSessId]);
        }
        // Update Unique Constraint (Generic DROP index logic)
        await queryRunner.query(`DROP INDEX IF EXISTS "REL_720ea71e7927fd070598ef06e1"`); // Using the one from previous turned discovery if applicable, but better to use table-based drop if it's a constraint.
        // Actually, for ClassSubject, let's just make it unique per session.
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_class_subject_unique_session" ON "class_subject" ("class_id", COALESCE("section_id", '00000000-0000-0000-0000-000000000000'), "subject_id", "tenant_id", "sessionId")`);


        // --- Subject Teacher ---
        await queryRunner.query(`ALTER TABLE "subject_teachers" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        if (activeSessId) {
            await queryRunner.query(`UPDATE "subject_teachers" SET "sessionId" = $1 WHERE "sessionId" IS NULL`, [activeSessId]);
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subject_teachers_session" ON "subject_teachers" ("sessionId")`);


        // --- Grade Scale ---
        await queryRunner.query(`ALTER TABLE "grade_scales" ADD COLUMN IF NOT EXISTS "sessionId" uuid`);
        if (activeSessId) {
            await queryRunner.query(`UPDATE "grade_scales" SET "sessionId" = $1 WHERE "sessionId" IS NULL`, [activeSessId]);
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_grade_scales_session" ON "grade_scales" ("sessionId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "grade_scales" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "subject_teachers" DROP COLUMN IF EXISTS "sessionId"`);
        await queryRunner.query(`ALTER TABLE "class_subject" DROP COLUMN IF EXISTS "sessionId"`);
    }

}
