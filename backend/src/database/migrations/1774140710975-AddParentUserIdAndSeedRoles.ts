import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentUserIdAndSeedRoles1774140710975 implements MigrationInterface {
    name = 'AddParentUserIdAndSeedRoles1774140710975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parents" ADD "userId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "parents" DROP COLUMN "userId"`);
    }

}
