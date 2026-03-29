import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAttendanceUniqueIndex1775300000000 implements MigrationInterface {
    name = 'FixAttendanceUniqueIndex1775300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop the old unique index
        await queryRunner.query(`DROP INDEX IF EXISTS "REL_720ea71e7927fd070598ef06e1"`);

        // 2. Create the new unique index including sessionId
        await queryRunner.query(`CREATE UNIQUE INDEX "REL_720ea71e7927fd070598ef06e1" ON "student_attendance" ("studentId", "date", "tenantId", "sessionId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "REL_720ea71e7927fd070598ef06e1"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "REL_720ea71e7927fd070598ef06e1" ON "student_attendance" ("studentId", "date", "tenantId")`);
    }

}
