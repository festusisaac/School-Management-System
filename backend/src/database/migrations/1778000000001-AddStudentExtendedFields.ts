import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentExtendedFields1778000000001 implements MigrationInterface {
    name = 'AddStudentExtendedFields1778000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const addColumnIfNotExists = async (table: string, column: string, definition: string) => {
            const exists = await queryRunner.query(`
                SELECT 1 FROM information_schema.columns
                WHERE table_name = '${table}' AND column_name = '${column}'
            `);
            if (!exists || exists.length === 0) {
                await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
            }
        };

        // Medical & Health Records
        await addColumnIfNotExists('students', 'specialPhysicalHealthProblems', 'text');
        await addColumnIfNotExists('students', 'hasDisability', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('students', 'hasAllergies', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('students', 'allergyDetails', 'text');
        await addColumnIfNotExists('students', 'familyDoctorName', 'character varying');
        await addColumnIfNotExists('students', 'familyDoctorPhone', 'character varying');
        await addColumnIfNotExists('students', 'familyDoctorClinicAddress', 'text');
        await addColumnIfNotExists('students', 'firstAidConsent', 'boolean NOT NULL DEFAULT false');

        // Faith & Religious Participation
        await addColumnIfNotExists('students', 'catholicFaithConsent', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('students', 'isBaptized', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('students', 'isCommunicant', 'boolean NOT NULL DEFAULT false');

        // Legal & Finalization
        await addColumnIfNotExists('students', 'applicationFeeReference', 'character varying');
        await addColumnIfNotExists('students', 'undertakingAccepted', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('students', 'parentSignature', 'boolean NOT NULL DEFAULT false');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const dropColumnIfExists = async (table: string, column: string) => {
            const exists = await queryRunner.query(`
                SELECT 1 FROM information_schema.columns
                WHERE table_name = '${table}' AND column_name = '${column}'
            `);
            if (exists && exists.length > 0) {
                await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "${column}"`);
            }
        };

        await dropColumnIfExists('students', 'parentSignature');
        await dropColumnIfExists('students', 'undertakingAccepted');
        await dropColumnIfExists('students', 'applicationFeeReference');
        await dropColumnIfExists('students', 'isCommunicant');
        await dropColumnIfExists('students', 'isBaptized');
        await dropColumnIfExists('students', 'catholicFaithConsent');
        await dropColumnIfExists('students', 'firstAidConsent');
        await dropColumnIfExists('students', 'familyDoctorClinicAddress');
        await dropColumnIfExists('students', 'familyDoctorPhone');
        await dropColumnIfExists('students', 'familyDoctorName');
        await dropColumnIfExists('students', 'allergyDetails');
        await dropColumnIfExists('students', 'hasAllergies');
        await dropColumnIfExists('students', 'hasDisability');
        await dropColumnIfExists('students', 'specialPhysicalHealthProblems');
    }
}
