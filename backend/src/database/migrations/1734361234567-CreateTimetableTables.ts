import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimetableTables1734361234567 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create period_type enum if not exists
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "period_type_enum" AS ENUM ('LESSON', 'ASSEMBLY', 'BREAK', 'LUNCH', 'GAMES', 'ACTIVITY');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create timetable_periods table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "timetable_periods" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "type" "period_type_enum" NOT NULL DEFAULT 'LESSON',
                "startTime" TIME NOT NULL,
                "endTime" TIME NOT NULL,
                "periodOrder" integer NOT NULL,
                "tenantId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_timetable_periods" PRIMARY KEY ("id")
            )
        `);

        // Create timetables table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "timetables" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "classId" uuid NOT NULL,
                "sectionId" uuid NOT NULL,
                "dayOfWeek" integer NOT NULL,
                "periodId" uuid NOT NULL,
                "subjectId" uuid NOT NULL,
                "teacherId" uuid,
                "roomNumber" character varying,
                "tenantId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_timetables" PRIMARY KEY ("id"),
                CONSTRAINT "FK_timetables_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_timetables_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_timetables_period" FOREIGN KEY ("periodId") REFERENCES "timetable_periods"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_timetables_subject" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE
            )
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_timetable_periods_tenant" ON "timetable_periods" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_timetables_class_section" ON "timetables" ("classId", "sectionId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_timetables_tenant" ON "timetables" ("tenantId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_timetables_unique_slot" ON "timetables" ("classId", "sectionId", "dayOfWeek", "periodId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "timetables"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "timetable_periods"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "period_type_enum"`);
    }
}

