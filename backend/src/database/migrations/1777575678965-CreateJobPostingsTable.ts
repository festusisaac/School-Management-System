import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJobPostingsTable1777575678965 implements MigrationInterface {
    name = 'CreateJobPostingsTable1777575678965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."job_postings_type_enum" AS ENUM('Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance')`);
        await queryRunner.query(`CREATE TYPE "public"."job_postings_status_enum" AS ENUM('Open', 'Closed', 'Filled')`);
        await queryRunner.query(`CREATE TABLE "job_postings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "company" character varying NOT NULL, "location" character varying, "type" "public"."job_postings_type_enum" NOT NULL DEFAULT 'Full-time', "description" text NOT NULL, "requirements" text, "salaryRange" character varying, "applicationUrl" character varying, "status" "public"."job_postings_status_enum" NOT NULL DEFAULT 'Open', "tenantId" character varying NOT NULL, "postedDate" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dda635ece382c8ad2d90a179182" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_64b09c33f7eecf3dec51bd186e" ON "job_postings" ("tenantId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_64b09c33f7eecf3dec51bd186e"`);
        await queryRunner.query(`DROP TABLE "job_postings"`);
        await queryRunner.query(`DROP TYPE "public"."job_postings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."job_postings_type_enum"`);
    }

}
