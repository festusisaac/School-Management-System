import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLessonNoteToSingleContent1777995399655 implements MigrationInterface {
    name = 'UpdateLessonNoteToSingleContent1777995399655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "presentationSteps"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "subTopic"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "behavioralObjectives"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "instructionalMaterials"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "previousKnowledge"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "referenceMaterials"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "introduction"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "evaluation"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "summary"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "assignment"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "content" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_notes" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "assignment" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "summary" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "evaluation" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "introduction" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "referenceMaterials" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "previousKnowledge" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "instructionalMaterials" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "behavioralObjectives" text`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "subTopic" character varying`);
        await queryRunner.query(`ALTER TABLE "lesson_notes" ADD "presentationSteps" jsonb`);
    }

}
