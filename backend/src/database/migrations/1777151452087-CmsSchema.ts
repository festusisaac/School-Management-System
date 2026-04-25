import { MigrationInterface, QueryRunner } from "typeorm";

export class CmsSchema1777151452087 implements MigrationInterface {
    name = 'CmsSchema1777151452087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_testimonials" ("id" SERIAL NOT NULL, "author" character varying NOT NULL, "role" character varying NOT NULL, "quote" text NOT NULL, "rating" integer NOT NULL DEFAULT '5', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e04e942134b987aff910e2b664e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_stats" ("id" SERIAL NOT NULL, "label" character varying NOT NULL, "value" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_7ecf5672d04e25adeab4e26eb84" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_sections" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "imageUrl" character varying, "metadata" jsonb, CONSTRAINT "UQ_2fe3004d3003c34c06017df8955" UNIQUE ("key"), CONSTRAINT "PK_8a6c47187b3218a942778ad2e9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_programs" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "imageUrl" character varying NOT NULL, "level" character varying NOT NULL, CONSTRAINT "PK_91d66aec0143830814862f5ff0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_news" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "slug" character varying NOT NULL, "tag" character varying NOT NULL, "author" character varying NOT NULL, "snippet" text NOT NULL, "content" text, "imageUrl" character varying, "date" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f8deddd7cc1113130b3089869e6" UNIQUE ("slug"), CONSTRAINT "PK_701bd9f7c9592eb7f9bca67965d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_carousel_images" ("id" SERIAL NOT NULL, "imageUrl" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', "heroId" integer, CONSTRAINT "PK_073f55600eeb93d3813c85ae00c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_heroes" ("id" SERIAL NOT NULL, "title" character varying NOT NULL DEFAULT 'Nurturing Leaders of Tomorrow', "subtitle" character varying NOT NULL DEFAULT 'Welcome to our school, where we combine academic rigor with moral guidance.', "welcomeText" character varying NOT NULL DEFAULT 'Excellence in Education', CONSTRAINT "PK_cbee718cb07db178c70ceeb7712" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_gallery_items" ("id" SERIAL NOT NULL, "imageUrl" character varying NOT NULL, "title" character varying NOT NULL, "category" character varying NOT NULL, CONSTRAINT "PK_9bfa67d34bf16675f664fc9a832" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "subject" character varying, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_467c4a3c431e8bf0b0c47bd28b9" PRIMARY KEY ("id"))`);
        const constraintCheck = await queryRunner.query(`
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_487cc658b7c50f7c1af194c40c3' 
            AND table_name = 'cms_carousel_images'
        `);
        if (constraintCheck.length === 0) {
            await queryRunner.query(`ALTER TABLE "cms_carousel_images" ADD CONSTRAINT "FK_487cc658b7c50f7c1af194c40c3" FOREIGN KEY ("heroId") REFERENCES "cms_heroes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cms_carousel_images" DROP CONSTRAINT "FK_487cc658b7c50f7c1af194c40c3"`);
        await queryRunner.query(`DROP TABLE "cms_contacts"`);
        await queryRunner.query(`DROP TABLE "cms_gallery_items"`);
        await queryRunner.query(`DROP TABLE "cms_heroes"`);
        await queryRunner.query(`DROP TABLE "cms_carousel_images"`);
        await queryRunner.query(`DROP TABLE "cms_news"`);
        await queryRunner.query(`DROP TABLE "cms_programs"`);
        await queryRunner.query(`DROP TABLE "cms_sections"`);
        await queryRunner.query(`DROP TABLE "cms_stats"`);
        await queryRunner.query(`DROP TABLE "cms_testimonials"`);
    }

}
