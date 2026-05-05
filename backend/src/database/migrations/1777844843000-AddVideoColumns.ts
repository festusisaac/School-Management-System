import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoColumns1777844843000 implements MigrationInterface {
    name = 'AddVideoColumns1777844843000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'type' column to cms_gallery_items (default 'image')
        await queryRunner.query(`ALTER TABLE "cms_gallery_items" ADD COLUMN IF NOT EXISTS "type" character varying NOT NULL DEFAULT 'image'`);

        // Add 'videoUrl' column to cms_gallery_items
        await queryRunner.query(`ALTER TABLE "cms_gallery_items" ADD COLUMN IF NOT EXISTS "videoUrl" character varying`);

        // Add 'videoUrl' column to cms_heroes
        await queryRunner.query(`ALTER TABLE "cms_heroes" ADD COLUMN IF NOT EXISTS "videoUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cms_heroes" DROP COLUMN IF EXISTS "videoUrl"`);
        await queryRunner.query(`ALTER TABLE "cms_gallery_items" DROP COLUMN IF EXISTS "videoUrl"`);
        await queryRunner.query(`ALTER TABLE "cms_gallery_items" DROP COLUMN IF EXISTS "type"`);
    }

}
