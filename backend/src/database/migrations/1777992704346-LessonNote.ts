import { MigrationInterface, QueryRunner } from "typeorm";

export class LessonNote1777992704346 implements MigrationInterface {
    name = 'LessonNote1777992704346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_uploaded_by"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_term"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_session"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_subject"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_section"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_download_resources_class"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_visibility"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_class"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_section"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_subject"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_session"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_download_resources_term"`);
        await queryRunner.query(`CREATE TABLE "lesson_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "teacherId" uuid NOT NULL, "subjectId" uuid NOT NULL, "classId" uuid NOT NULL, "termId" uuid, "sessionId" uuid, "topic" character varying NOT NULL, "subTopic" character varying, "duration" character varying, "date" date, "behavioralObjectives" text, "instructionalMaterials" text, "previousKnowledge" text, "referenceMaterials" text, "introduction" text, "presentationSteps" jsonb, "evaluation" text, "summary" text, "assignment" text, "status" character varying NOT NULL DEFAULT 'draft', "reviewNotes" text, "reviewerId" uuid, "reviewedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_89780b18199ecda10d5913f3747" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2583c5599e714f736fcbdc7a94" ON "download_resources" ("resourceType") `);
        await queryRunner.query(`CREATE INDEX "IDX_02270640b084a42f08fa1b1adc" ON "download_resources" ("classId") `);
        await queryRunner.query(`CREATE INDEX "IDX_60a5f6852eeaf3591fd595780d" ON "download_resources" ("sectionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4e5fef4f579fc7e30a9f4c44de" ON "download_resources" ("subjectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_70cd22120605178cb14480409d" ON "download_resources" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_379d7e310c104433e4eb310056" ON "download_resources" ("termId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f5bc2502874fa511f633405ee0" ON "download_resources" ("visibility") `);
        await queryRunner.query(`CREATE INDEX "IDX_1d2bcaffcbed53a7f04012d503" ON "download_resources" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_fcf8670357294ccec587cef28b" ON "download_resources" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_02270640b084a42f08fa1b1adc2" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_60a5f6852eeaf3591fd595780d4" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_4e5fef4f579fc7e30a9f4c44de6" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_70cd22120605178cb14480409d5" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_379d7e310c104433e4eb3100566" FOREIGN KEY ("termId") REFERENCES "academic_terms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_60bb9a0b013388fb33eed1cbd4a" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD CONSTRAINT "FK_22e326eb358d7210712c95ddcec" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD CONSTRAINT "FK_b2bf2ae12e4a2a685f483f194cc" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD CONSTRAINT "FK_355bb08935ae700b625feef3c00" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD CONSTRAINT "FK_5ae791eba241477686e52061432" FOREIGN KEY ("termId") REFERENCES "academic_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD CONSTRAINT "FK_9515c007e8c8d94ba76a766d77e" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD CONSTRAINT "FK_c3fa7107e3f229bd56923e659b1" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_c3fa7107e3f229bd56923e659b1"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_9515c007e8c8d94ba76a766d77e"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_5ae791eba241477686e52061432"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_355bb08935ae700b625feef3c00"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_b2bf2ae12e4a2a685f483f194cc"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_22e326eb358d7210712c95ddcec"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_60bb9a0b013388fb33eed1cbd4a"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_379d7e310c104433e4eb3100566"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_70cd22120605178cb14480409d5"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_4e5fef4f579fc7e30a9f4c44de6"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_60a5f6852eeaf3591fd595780d4"`);
        await queryRunner.query(`ALTER TABLE "download_resources" DROP CONSTRAINT "FK_02270640b084a42f08fa1b1adc2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fcf8670357294ccec587cef28b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d2bcaffcbed53a7f04012d503"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5bc2502874fa511f633405ee0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_379d7e310c104433e4eb310056"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_70cd22120605178cb14480409d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e5fef4f579fc7e30a9f4c44de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60a5f6852eeaf3591fd595780d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02270640b084a42f08fa1b1adc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2583c5599e714f736fcbdc7a94"`);
        await queryRunner.query(`DROP TABLE "lesson_notes"`);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_term" ON "download_resources" ("termId") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_session" ON "download_resources" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_subject" ON "download_resources" ("subjectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_section" ON "download_resources" ("sectionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_class" ON "download_resources" ("classId") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_visibility" ON "download_resources" ("visibility") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_status" ON "download_resources" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_type" ON "download_resources" ("resourceType") `);
        await queryRunner.query(`CREATE INDEX "IDX_download_resources_tenant" ON "download_resources" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_subject" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_session" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_term" FOREIGN KEY ("termId") REFERENCES "academic_terms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "download_resources" ADD CONSTRAINT "FK_download_resources_uploaded_by" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
