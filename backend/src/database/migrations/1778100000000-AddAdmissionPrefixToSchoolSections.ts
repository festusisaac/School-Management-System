import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdmissionPrefixToSchoolSections1778100000000 implements MigrationInterface {
    name = 'AddAdmissionPrefixToSchoolSections1778100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "school_sections" ADD COLUMN IF NOT EXISTS "admissionPrefix" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "school_sections" DROP COLUMN IF EXISTS "admissionPrefix"`);
    }
}
