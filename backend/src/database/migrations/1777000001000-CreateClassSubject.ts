import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateClassSubject1777000001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create table IF NOT EXISTS
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "class_subject" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "class_id" uuid NOT NULL,
            "subject_id" uuid NOT NULL,
            "is_core" boolean NOT NULL DEFAULT true,
            "is_active" boolean NOT NULL DEFAULT true,
            "tenant_id" uuid NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_class_subject_id" PRIMARY KEY ("id")
        )`);

        // 2. Add Foreign Keys safely
        await queryRunner.query(`ALTER TABLE "class_subject" DROP CONSTRAINT IF EXISTS "FK_ace9655644e5be381630ab7796a"`);
        await queryRunner.query(`ALTER TABLE "class_subject" ADD CONSTRAINT "FK_ace9655644e5be381630ab7796a" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE`);

        await queryRunner.query(`ALTER TABLE "class_subject" DROP CONSTRAINT IF EXISTS "FK_f37e408543441ef51f08832a88a"`);
        await queryRunner.query(`ALTER TABLE "class_subject" ADD CONSTRAINT "FK_f37e408543441ef51f08832a88a" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE`);

        // 3. Create unique constraint index safely
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_class_subject_unique"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_class_subject_unique" ON "class_subject" ("class_id", "subject_id", "tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_class_subject_unique"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "class_subject"`);
    }
}
