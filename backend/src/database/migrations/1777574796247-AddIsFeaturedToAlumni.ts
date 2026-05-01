import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFeaturedToAlumni1777574796247 implements MigrationInterface {
    name = 'AddIsFeaturedToAlumni1777574796247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alumni" ADD "isFeatured" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alumni" DROP COLUMN "isFeatured"`);
    }

}
