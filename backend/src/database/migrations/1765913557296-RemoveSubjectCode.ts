import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSubjectCode1765913557296 implements MigrationInterface {
    name = 'RemoveSubjectCode1765913557296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "UQ_542cbba74dde3c82ab49c573109"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "sections" DROP COLUMN "capacity"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "UQ_542cbba74dde3c82ab49c573109"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "sections" ADD "capacity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD CONSTRAINT "UQ_542cbba74dde3c82ab49c573109" UNIQUE ("code")`);
    }

}
