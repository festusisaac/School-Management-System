import { MigrationInterface, QueryRunner } from "typeorm";

export class CmsSchema1777151023972 implements MigrationInterface {
    name = 'CmsSchema1777151023972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cms_news" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "slug" character varying NOT NULL, "tag" character varying NOT NULL, "author" character varying NOT NULL, "snippet" text NOT NULL, "content" text, "imageUrl" character varying, "date" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f8deddd7cc1113130b3089869e6" UNIQUE ("slug"), CONSTRAINT "PK_701bd9f7c9592eb7f9bca67965d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "cms_news"`);
    }

}
