import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLibrarySettings1775000001000 implements MigrationInterface {
    name = 'CreateLibrarySettings1775000001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "library_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "graceDays" integer NOT NULL DEFAULT 3, "finePerDay" numeric NOT NULL DEFAULT 50, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_library_settings" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_library_settings_tenant" ON "library_settings" ("tenantId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_library_settings_tenant"`);
        await queryRunner.query(`DROP TABLE "library_settings"`);
    }

}
