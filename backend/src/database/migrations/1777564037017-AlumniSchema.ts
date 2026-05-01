import { MigrationInterface, QueryRunner } from "typeorm";

export class AlumniSchema1777564037017 implements MigrationInterface {
    name = 'AlumniSchema1777564037017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "alumni" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid, "graduationYear" integer NOT NULL, "currentOccupation" character varying, "currentCompany" character varying, "linkedInUrl" character varying, "location" character varying, "achievements" text, "address" text, "email" character varying, "phoneNumber" character varying, "tenantId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_29db184135f4279adf63ac490f" UNIQUE ("studentId"), CONSTRAINT "PK_6947d90e8215d18adec98799895" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_29db184135f4279adf63ac490f" ON "alumni" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f48f0bf7bd4124504f7a1982e" ON "alumni" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "alumni_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "eventDate" TIMESTAMP NOT NULL, "location" character varying, "status" character varying NOT NULL DEFAULT 'upcoming', "bannerImage" character varying, "tenantId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_af8611b8e80500cddfb77710f4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7fafbe364fb1b921d953cd4999" ON "alumni_events" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "online_admissions" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "alumni" ADD CONSTRAINT "FK_29db184135f4279adf63ac490fb" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alumni" DROP CONSTRAINT "FK_29db184135f4279adf63ac490fb"`);
        await queryRunner.query(`ALTER TABLE "online_admissions" ADD "email" character varying`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fafbe364fb1b921d953cd4999"`);
        await queryRunner.query(`DROP TABLE "alumni_events"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f48f0bf7bd4124504f7a1982e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29db184135f4279adf63ac490f"`);
        await queryRunner.query(`DROP TABLE "alumni"`);
    }

}
