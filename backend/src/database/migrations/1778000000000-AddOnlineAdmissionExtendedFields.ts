import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnlineAdmissionExtendedFields1778000000000 implements MigrationInterface {
    name = 'AddOnlineAdmissionExtendedFields1778000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Helper: add column only if it doesn't already exist
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
        await addColumnIfNotExists('online_admissions', 'specialPhysicalHealthProblems', 'text');
        await addColumnIfNotExists('online_admissions', 'hasDisability', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('online_admissions', 'hasAllergies', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('online_admissions', 'allergyDetails', 'text');
        await addColumnIfNotExists('online_admissions', 'familyDoctorName', 'character varying');
        await addColumnIfNotExists('online_admissions', 'familyDoctorPhone', 'character varying');
        await addColumnIfNotExists('online_admissions', 'familyDoctorClinicAddress', 'text');
        await addColumnIfNotExists('online_admissions', 'firstAidConsent', 'boolean NOT NULL DEFAULT false');

        // Faith & Religious Participation
        await addColumnIfNotExists('online_admissions', 'catholicFaithConsent', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('online_admissions', 'isBaptized', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('online_admissions', 'isCommunicant', 'boolean NOT NULL DEFAULT false');

        // Legal & Finalization
        await addColumnIfNotExists('online_admissions', 'applicationFeeReference', 'character varying');
        await addColumnIfNotExists('online_admissions', 'undertakingAccepted', 'boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('online_admissions', 'parentSignature', 'boolean NOT NULL DEFAULT false');

        // Additional Documents (jsonb)
        await addColumnIfNotExists('online_admissions', 'documents', 'jsonb');
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

        await dropColumnIfExists('online_admissions', 'documents');
        await dropColumnIfExists('online_admissions', 'parentSignature');
        await dropColumnIfExists('online_admissions', 'undertakingAccepted');
        await dropColumnIfExists('online_admissions', 'applicationFeeReference');
        await dropColumnIfExists('online_admissions', 'isCommunicant');
        await dropColumnIfExists('online_admissions', 'isBaptized');
        await dropColumnIfExists('online_admissions', 'catholicFaithConsent');
        await dropColumnIfExists('online_admissions', 'firstAidConsent');
        await dropColumnIfExists('online_admissions', 'familyDoctorClinicAddress');
        await dropColumnIfExists('online_admissions', 'familyDoctorPhone');
        await dropColumnIfExists('online_admissions', 'familyDoctorName');
        await dropColumnIfExists('online_admissions', 'allergyDetails');
        await dropColumnIfExists('online_admissions', 'hasAllergies');
        await dropColumnIfExists('online_admissions', 'hasDisability');
        await dropColumnIfExists('online_admissions', 'specialPhysicalHealthProblems');
    }
}
