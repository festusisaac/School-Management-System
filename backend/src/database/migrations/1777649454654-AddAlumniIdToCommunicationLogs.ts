import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlumniIdToCommunicationLogs1777649454654 implements MigrationInterface {
    name = 'AddAlumniIdToCommunicationLogs1777649454654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communication_logs" ADD "alumniId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communication_logs" DROP COLUMN "alumniId"`);
    }

}
