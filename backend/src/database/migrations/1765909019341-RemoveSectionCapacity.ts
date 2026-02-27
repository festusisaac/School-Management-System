import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSectionCapacity1765909019341 implements MigrationInterface {
    name = 'RemoveSectionCapacity1765909019341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sections" DROP COLUMN "capacity"`);
        await queryRunner.query(`ALTER TABLE "sections" ADD "capacity" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sections" DROP COLUMN "capacity"`);
        await queryRunner.query(`ALTER TABLE "sections" ADD "capacity" integer NOT NULL DEFAULT '0'`);
    }

}
