import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDesignation1774086000000 implements MigrationInterface {
    name = 'RemoveDesignation1774086000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop the foreign key constraint from staff table
        // We need to find the constraint name first. Usually it's FK_...
        // But we can also use a more direct SQL approach.
        await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN IF EXISTS "designation_id"`);
        
        // 2. Drop the designations table
        await queryRunner.query(`DROP TABLE IF EXISTS "designations"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-create designations table
        await queryRunner.query(`CREATE TABLE "designations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_designations" PRIMARY KEY ("id"))`);
        
        // Add designation_id column back to staff
        await queryRunner.query(`ALTER TABLE "staff" ADD "designation_id" uuid`);
    }
}
