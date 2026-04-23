import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportCardConfigToSystemSettings1776100000000 implements MigrationInterface {
    name = 'AddReportCardConfigToSystemSettings1776100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "system_settings"
            ADD COLUMN IF NOT EXISTS "reportCardConfig" jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "system_settings"
            DROP COLUMN IF EXISTS "reportCardConfig"
        `);
    }
}
