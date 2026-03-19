import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingGeneralSettings1773905764237 implements MigrationInterface {
    name = 'AddMissingGeneralSettings1773905764237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "currencySymbol" character varying NOT NULL DEFAULT '₦'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "currencyCode" character varying NOT NULL DEFAULT 'NGN'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "taxNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "invoicePrefix" character varying NOT NULL DEFAULT 'INV-'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "admissionNumberPrefix" character varying NOT NULL DEFAULT 'SCH/'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "staffIdPrefix" character varying NOT NULL DEFAULT 'STF/'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "officialWebsite" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "whatsappNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "emailFromName" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "socialYoutube" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "socialLinkedin" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "isMaintenanceMode" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "sessionTimeoutMinutes" integer NOT NULL DEFAULT '60'`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "maxFileUploadSizeMb" integer NOT NULL DEFAULT '2'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "maxFileUploadSizeMb"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "sessionTimeoutMinutes"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "isMaintenanceMode"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "socialLinkedin"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "socialYoutube"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "emailFromName"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "whatsappNumber"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "officialWebsite"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "staffIdPrefix"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "admissionNumberPrefix"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "invoicePrefix"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "taxNumber"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "currencyCode"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "currencySymbol"`);
    }

}
