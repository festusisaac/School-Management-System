import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateClassSubject1735203593000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'class_subject',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'class_id',
                        type: 'uuid',
                    },
                    {
                        name: 'subject_id',
                        type: 'uuid',
                    },
                    {
                        name: 'is_core',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'tenant_id',
                        type: 'uuid',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Add foreign key for class_id
        await queryRunner.createForeignKey(
            'class_subject',
            new TableForeignKey({
                columnNames: ['class_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'classes',
                onDelete: 'CASCADE',
            }),
        );

        // Add foreign key for subject_id
        await queryRunner.createForeignKey(
            'class_subject',
            new TableForeignKey({
                columnNames: ['subject_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'subjects',
                onDelete: 'CASCADE',
            }),
        );

        // Create unique constraint
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_class_subject_unique" ON "class_subject" ("class_id", "subject_id", "tenant_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_class_subject_unique"`);
        await queryRunner.dropTable('class_subject');
    }
}
