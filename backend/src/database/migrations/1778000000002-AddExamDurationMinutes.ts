import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddExamDurationMinutes1778000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add durationMinutes to exams table
        await queryRunner.addColumn(
            "exams",
            new TableColumn({
                name: "durationMinutes",
                type: "int",
                isNullable: true,
                default: 60,
            })
        );

        // Add durationMinutes to exam_schedules table
        await queryRunner.addColumn(
            "exam_schedules",
            new TableColumn({
                name: "durationMinutes",
                type: "int",
                isNullable: true,
                default: 60,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("exam_schedules", "durationMinutes");
        await queryRunner.dropColumn("exams", "durationMinutes");
    }
}
