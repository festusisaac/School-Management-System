import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class DonationsSchema1777700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create donation_projects table
        await queryRunner.createTable(new Table({
            name: "donation_projects",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid"
                },
                {
                    name: "title",
                    type: "varchar"
                },
                {
                    name: "description",
                    type: "text"
                },
                {
                    name: "goalAmount",
                    type: "decimal",
                    precision: 12,
                    scale: 2
                },
                {
                    name: "currentAmount",
                    type: "decimal",
                    precision: 12,
                    scale: 2,
                    default: 0
                },
                {
                    name: "endDate",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "varchar",
                    default: "'active'"
                },
                {
                    name: "bannerImage",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "tenantId",
                    type: "varchar"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // 2. Create donations table
        await queryRunner.createTable(new Table({
            name: "donations",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid"
                },
                {
                    name: "alumniId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "projectId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "donorName",
                    type: "varchar"
                },
                {
                    name: "donorEmail",
                    type: "varchar"
                },
                {
                    name: "amount",
                    type: "decimal",
                    precision: 12,
                    scale: 2
                },
                {
                    name: "status",
                    type: "varchar",
                    default: "'pending'"
                },
                {
                    name: "paymentReference",
                    type: "varchar",
                    isUnique: true
                },
                {
                    name: "paymentGateway",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "paymentMetadata",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "tenantId",
                    type: "varchar"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // 3. Add Foreign Keys
        await queryRunner.createForeignKey("donations", new TableForeignKey({
            columnNames: ["alumniId"],
            referencedColumnNames: ["id"],
            referencedTableName: "alumni",
            onDelete: "SET NULL"
        }));

        await queryRunner.createForeignKey("donations", new TableForeignKey({
            columnNames: ["projectId"],
            referencedColumnNames: ["id"],
            referencedTableName: "donation_projects",
            onDelete: "SET NULL"
        }));

        // 4. Add Indexes
        await queryRunner.createIndex("donation_projects", new TableIndex({
            name: "IDX_DONATION_PROJECTS_TENANT",
            columnNames: ["tenantId"]
        }));

        await queryRunner.createIndex("donations", new TableIndex({
            name: "IDX_DONATIONS_TENANT",
            columnNames: ["tenantId"]
        }));

        // 5. Seed Permissions
        await queryRunner.query(`
            INSERT INTO "permissions" (slug, name, module, description)
            VALUES 
            ('donations:view', 'View Donations', 'Donations', 'Access donation history and impact reports'),
            ('donations:manage_projects', 'Manage Crowdfunding', 'Donations', 'Create and edit school fundraising projects')
            ON CONFLICT (slug) DO NOTHING;
        `);

        // 6. Assign permissions to Super Administrator role
        await queryRunner.query(`
            INSERT INTO "role_permissions" ("roleId", "permissionId")
            SELECT r.id, p.id 
            FROM "roles" r, "permissions" p
            WHERE r.name = 'Super Administrator' 
            AND p.slug IN ('donations:view', 'donations:manage_projects')
            ON CONFLICT DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove permissions
        await queryRunner.query(`DELETE FROM "permissions" WHERE slug IN ('donations:view', 'donations:manage_projects')`);
        
        await queryRunner.dropTable("donations");
        await queryRunner.dropTable("donation_projects");
    }
}
