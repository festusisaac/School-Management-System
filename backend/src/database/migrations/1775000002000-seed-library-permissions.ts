import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLibraryPermissions1775000002000 implements MigrationInterface {
  name = 'SeedLibraryPermissions1775000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO permissions (id, slug, name, module, "createdAt", "updatedAt")
      SELECT uuid_generate_v4(), 'library:view_books', 'View Books', 'Library', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE slug = 'library:view_books')`);

    await queryRunner.query(`INSERT INTO permissions (id, slug, name, module, "createdAt", "updatedAt")
      SELECT uuid_generate_v4(), 'library:manage_books', 'Manage Books', 'Library', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE slug = 'library:manage_books')`);

    await queryRunner.query(`INSERT INTO permissions (id, slug, name, module, "createdAt", "updatedAt")
      SELECT uuid_generate_v4(), 'library:issue_return', 'Issue/Return Books', 'Library', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE slug = 'library:issue_return')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM permissions WHERE slug IN ('library:view_books','library:manage_books','library:issue_return')`);
  }
}
