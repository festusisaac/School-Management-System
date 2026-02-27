import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchoolSections1735210000000 implements MigrationInterface {
    name = 'CreateSchoolSections1735210000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create school_sections table
        await queryRunner.query(`CREATE TABLE "school_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying, "description" text, "isActive" boolean NOT NULL DEFAULT true, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_school_sections_id" PRIMARY KEY ("id"))`);

        // Add schoolSectionId to classes table
        await queryRunner.query(`ALTER TABLE "classes" ADD "schoolSectionId" uuid`);

        // Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_classes_school_section" FOREIGN KEY ("schoolSectionId") REFERENCES "school_sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_classes_school_section"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN "schoolSectionId"`);
        await queryRunner.query(`DROP TABLE "school_sections"`);
    }
}
