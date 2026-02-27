import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeSectionsOptional1735220000000 implements MigrationInterface {
    name = 'MakeSectionsOptional1735220000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Make sectionId nullable in subject_teachers
        await queryRunner.query(`ALTER TABLE "subject_teachers" ALTER COLUMN "sectionId" DROP NOT NULL`);

        // 2. Add classId to subject_teachers
        await queryRunner.query(`ALTER TABLE "subject_teachers" ADD "classId" uuid`);
        await queryRunner.query(`ALTER TABLE "subject_teachers" ADD CONSTRAINT "FK_subject_teachers_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE`);

        // 3. Make sectionId nullable in timetables
        await queryRunner.query(`ALTER TABLE "timetables" ALTER COLUMN "sectionId" DROP NOT NULL`);

        // 4. Add classTeacherId to classes
        await queryRunner.query(`ALTER TABLE "classes" ADD "classTeacherId" uuid`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_classes_teacher" FOREIGN KEY ("classTeacherId") REFERENCES "staff"("id") ON DELETE SET NULL`);

        // 5. Backfill classId in subject_teachers from sections if sectionId is present
        await queryRunner.query(`
            UPDATE "subject_teachers" st
            SET "classId" = s."classId"
            FROM "sections" s
            WHERE st."sectionId" = s."id"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_classes_teacher"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN "classTeacherId"`);
        await queryRunner.query(`ALTER TABLE "timetables" ALTER COLUMN "sectionId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subject_teachers" DROP CONSTRAINT "FK_subject_teachers_class"`);
        await queryRunner.query(`ALTER TABLE "subject_teachers" DROP COLUMN "classId"`);
        await queryRunner.query(`ALTER TABLE "subject_teachers" ALTER COLUMN "sectionId" SET NOT NULL`);
    }

}
