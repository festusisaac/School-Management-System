import { MigrationInterface, QueryRunner } from "typeorm";

export class RolePermissionsJoinTable1777155000000 implements MigrationInterface {
    name = 'RolePermissionsJoinTable1777155000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_permissions" (
                "roleId" uuid NOT NULL,
                "permissionId" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_role_permissions_roleId" ON "role_permissions" ("roleId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_role_permissions_permissionId" ON "role_permissions" ("permissionId")`);
        
        // Add foreign keys safely
        const fk1 = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_role_permissions_roleId' AND table_name = 'role_permissions'
        `);
        if (fk1.length === 0) {
            await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_roleId" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        }

        const fk2 = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_role_permissions_permissionId' AND table_name = 'role_permissions'
        `);
        if (fk2.length === 0) {
            await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permissionId" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    }
}
