import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDownloadResources1777900000000 implements MigrationInterface {
  name = 'CreateDownloadResources1777900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "download_resources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "resourceType" character varying NOT NULL DEFAULT 'material',
        "category" character varying,
        "fileUrl" character varying,
        "externalUrl" character varying,
        "provider" character varying,
        "thumbnailUrl" character varying,
        "mimeType" character varying,
        "fileSize" bigint,
        "classId" uuid,
        "sectionId" uuid,
        "subjectId" uuid,
        "sessionId" uuid,
        "termId" uuid,
        "visibility" character varying NOT NULL DEFAULT 'students',
        "status" character varying NOT NULL DEFAULT 'draft',
        "isFeatured" boolean NOT NULL DEFAULT false,
        "downloadCount" integer NOT NULL DEFAULT 0,
        "viewCount" integer NOT NULL DEFAULT 0,
        "uploadedById" uuid,
        "tenantId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_download_resources_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_download_resources_tenant" ON "download_resources" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_type" ON "download_resources" ("resourceType")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_status" ON "download_resources" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_visibility" ON "download_resources" ("visibility")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_class" ON "download_resources" ("classId")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_section" ON "download_resources" ("sectionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_subject" ON "download_resources" ("subjectId")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_session" ON "download_resources" ("sessionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_download_resources_term" ON "download_resources" ("termId")`);

    await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_subject" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_term" FOREIGN KEY ("termId") REFERENCES "academic_terms"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_uploaded_by" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_uploaded_by"`);
    await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_term"`);
    await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_session"`);
    await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_subject"`);
    await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_section"`);
    await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_class"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_term"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_session"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_subject"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_section"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_class"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_visibility"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_status"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_type"`);
    await queryRunner.query(`DROP INDEX "IDX_download_resources_tenant"`);
    await queryRunner.query(`DROP TABLE "download_resources"`);
  }
}
