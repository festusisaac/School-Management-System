import { MigrationInterface, QueryRunner } from "typeorm";

export class TargetGraduationYear1777662557964 implements MigrationInterface {
    name = 'TargetGraduationYear1777662557964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alumni_events" ADD "targetGraduationYear" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alumni_events" DROP COLUMN "targetGraduationYear"`);
    }

}
