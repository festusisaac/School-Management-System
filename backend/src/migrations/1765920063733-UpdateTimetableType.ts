import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTimetableType1765920063733 implements MigrationInterface {
    name = 'UpdateTimetableType1765920063733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timetable_periods" DROP COLUMN "isBreak"`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" DROP COLUMN "isActive"`);
        await queryRunner.query(`CREATE TYPE "public"."timetable_periods_type_enum" AS ENUM('LESSON', 'ASSEMBLY', 'BREAK', 'LUNCH', 'GAMES', 'ACTIVITY')`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" ADD "type" "public"."timetable_periods_type_enum" NOT NULL DEFAULT 'LESSON'`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" ADD "tenantId" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timetable_periods" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."timetable_periods_type_enum"`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "timetable_periods" ADD "isBreak" boolean NOT NULL DEFAULT false`);
    }

}
