import { MigrationInterface, QueryRunner } from "typeorm";

export class AlumniSchemaEnhanced1777565144457 implements MigrationInterface {
    name = 'AlumniSchemaEnhanced1777565144457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "alumni_attendees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventId" uuid NOT NULL, "alumniId" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'registered', "notes" text, "tenantId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0826b4c8cbfaf8ebc6118a33279" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1fe1be9f1c87e959a57b43a8a7" ON "alumni_attendees" ("tenantId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c8dffe57bfb249270aaec110b" ON "alumni_attendees" ("eventId", "alumniId") `);
        await queryRunner.query(`ALTER TABLE "alumni" ADD "isMentorshipAvailable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "alumni" ADD "adminNotes" text`);
        await queryRunner.query(`ALTER TABLE "alumni_attendees" ADD CONSTRAINT "FK_639fb39dfb424986a479e0947dd" FOREIGN KEY ("eventId") REFERENCES "alumni_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alumni_attendees" ADD CONSTRAINT "FK_f94a966b0d9dd2feba6f98e8a3d" FOREIGN KEY ("alumniId") REFERENCES "alumni"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alumni_attendees" DROP CONSTRAINT "FK_f94a966b0d9dd2feba6f98e8a3d"`);
        await queryRunner.query(`ALTER TABLE "alumni_attendees" DROP CONSTRAINT "FK_639fb39dfb424986a479e0947dd"`);
        await queryRunner.query(`ALTER TABLE "alumni" DROP COLUMN "adminNotes"`);
        await queryRunner.query(`ALTER TABLE "alumni" DROP COLUMN "isMentorshipAvailable"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c8dffe57bfb249270aaec110b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1fe1be9f1c87e959a57b43a8a7"`);
        await queryRunner.query(`DROP TABLE "alumni_attendees"`);
    }

}
