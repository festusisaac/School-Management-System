import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtColumnToStudent1779902536540 implements MigrationInterface {
    name = 'AddDeletedAtColumnToStudent1779902536540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "students" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "exams" ALTER COLUMN "durationMinutes" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exam_schedules" ALTER COLUMN "durationMinutes" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam_schedules" ALTER COLUMN "durationMinutes" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exams" ALTER COLUMN "durationMinutes" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "deletedAt"`);
    }

}
