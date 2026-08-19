import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushTokens1786714925898 implements MigrationInterface {
  name = 'CreatePushTokens1786714925898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "push_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tenantId" character varying NOT NULL,
        "token" character varying NOT NULL,
        "platform" character varying NOT NULL DEFAULT 'android',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_push_tokens_token" UNIQUE ("token")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_push_tokens_user" ON "push_tokens" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_push_tokens_tenant" ON "push_tokens" ("tenantId")`);

    await queryRunner.query(`ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_push_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_push_tokens_user"`);
    await queryRunner.query(`DROP INDEX "IDX_push_tokens_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_push_tokens_user"`);
    await queryRunner.query(`DROP TABLE "push_tokens"`);
  }
}
