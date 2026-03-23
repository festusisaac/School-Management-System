import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runFix() {
    console.log('🚀 Starting Comprehensive System-Wide Data Fix Script...');
    
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected.');

        const tenantId = '00000000-0000-0000-0000-000000000001';

        const tablesToFix = [
            { name: 'users', column: 'tenantId' },
            { name: 'classes', column: 'tenantId' },
            { name: 'subjects', column: 'tenantId' },
            { name: 'subject_groups', column: 'tenantId' },
            { name: 'sections', column: 'tenantId' },
            { name: 'timetables', column: 'tenantId' },
            { name: 'timetable_periods', column: 'tenantId' },
            { name: 'transactions', column: 'tenantId' },
            // NEW TABLES
            { name: 'students', column: 'tenantId' },
            { name: 'staff', column: 'tenantId' },
            { name: 'parents', column: 'tenantId' },
            { name: 'departments', column: 'tenantId' },
            { name: 'student_categories', column: 'tenantId' },
            { name: 'student_houses', column: 'tenantId' },
            { name: 'deactivate_reasons', column: 'tenantId' },
            { name: 'student_documents', column: 'tenantId' },
            { name: 'online_admissions', column: 'tenantId' },
            // FINANCE TABLES
            { name: 'carry_forwards', column: 'tenantId' },
            { name: 'discount_profiles', column: 'tenantId' },
            { name: 'discount_rules', column: 'tenantId' },
            { name: 'discounts', column: 'tenantId' },
            { name: 'fee_assignments', column: 'tenantId' },
            { name: 'fee_groups', column: 'tenantId' },
            { name: 'fee_heads', column: 'tenantId' },
            { name: 'fee_structures', column: 'tenantId' },
            { name: 'payment_reminders', column: 'tenantId' },
            // EXAMINATION TABLES
            { name: 'exams', column: 'tenantId' },
            { name: 'exam_groups', column: 'tenantId' },
            { name: 'assessment_types', column: 'tenantId' },
            { name: 'exam_results', column: 'tenantId' },
            { name: 'exam_schedules', column: 'tenantId' },
            { name: 'affective_domains', column: 'tenantId' },
            { name: 'psychomotor_domains', column: 'tenantId' },
            { name: 'remark_configs', column: 'tenantId' },
            { name: 'admit_cards', column: 'tenantId' },
            { name: 'scratch_cards', column: 'tenantId' },
            { name: 'student_psychomotors', column: 'tenantId' },
            { name: 'student_skills', column: 'tenantId' },
            { name: 'student_term_results', column: 'tenantId' },
            { name: 'grade_scales', column: 'tenantId' },
        ];

        for (const table of tablesToFix) {
            console.log(`⏳ Updating ${table.name} table...`);
            try {
                let query = `UPDATE "${table.name}" SET "${table.column}" = $1 WHERE "${table.column}" IS NULL`;
                const result = await dataSource.query(query, [tenantId]);
                console.log(`   - Done.`);
            } catch (e: any) {
                console.warn(`   - Skip ${table.name}: ${e.message}`);
            }
        }

        console.log('\n✨ Comprehensive system-wide data fix completed successfully!');
    } catch (error) {
        console.error('❌ Error executing fix:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

runFix();
