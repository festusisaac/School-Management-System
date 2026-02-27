import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimetableTables1765915583979 implements MigrationInterface {
    name = 'AddTimetableTables1765915583979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "timetable_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "periodOrder" integer NOT NULL, "isBreak" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f5bf8b7371dc54409ecbab4bb7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "timetables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "classId" uuid NOT NULL, "sectionId" uuid NOT NULL, "dayOfWeek" integer NOT NULL, "periodId" uuid NOT NULL, "subjectId" uuid NOT NULL, "teacherId" uuid, "roomNumber" character varying, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9dd7e50645bff59e9ac5b4725c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "timetables" ADD CONSTRAINT "FK_44303a910b5c68ad67e0262997c" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timetables" ADD CONSTRAINT "FK_1343524b4fb8489ffd0b809f231" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timetables" ADD CONSTRAINT "FK_b7507644b5343013750d28e3144" FOREIGN KEY ("periodId") REFERENCES "timetable_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timetables" ADD CONSTRAINT "FK_4233dafa78c507affb46a3500fe" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timetables" DROP CONSTRAINT "FK_4233dafa78c507affb46a3500fe"`);
        await queryRunner.query(`ALTER TABLE "timetables" DROP CONSTRAINT "FK_b7507644b5343013750d28e3144"`);
        await queryRunner.query(`ALTER TABLE "timetables" DROP CONSTRAINT "FK_1343524b4fb8489ffd0b809f231"`);
        await queryRunner.query(`ALTER TABLE "timetables" DROP CONSTRAINT "FK_44303a910b5c68ad67e0262997c"`);
        await queryRunner.query(`DROP TABLE "timetables"`);
        await queryRunner.query(`DROP TABLE "timetable_periods"`);
    }

}
