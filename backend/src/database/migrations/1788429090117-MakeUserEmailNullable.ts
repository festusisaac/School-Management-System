import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUserEmailNullable1788429090117 implements MigrationInterface {
    name = 'MakeUserEmailNullable1788429090117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
    }

}
