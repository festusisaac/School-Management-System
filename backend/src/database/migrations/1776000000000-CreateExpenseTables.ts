import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenseTables1776000000000 implements MigrationInterface {
  name = 'CreateExpenseTables1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses_status_enum') THEN
          CREATE TYPE "public"."expenses_status_enum" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'PAID', 'REJECTED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenses_paymentmethod_enum') THEN
          CREATE TYPE "public"."expenses_paymentmethod_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'POS', 'CHEQUE', 'ONLINE');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expense_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "code" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "tenantId" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expense_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expense_vendors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "contactPerson" character varying,
        "email" character varying,
        "phone" character varying,
        "address" text,
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "tenantId" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expense_vendors_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "amount" numeric(12,2) NOT NULL,
        "expenseDate" date NOT NULL,
        "status" "public"."expenses_status_enum" NOT NULL DEFAULT 'PENDING',
        "paymentMethod" "public"."expenses_paymentmethod_enum",
        "categoryId" uuid NOT NULL,
        "vendorId" uuid,
        "referenceNumber" character varying,
        "receiptUrl" character varying,
        "notes" text,
        "sessionId" uuid,
        "schoolSectionId" uuid,
        "approvedById" uuid,
        "recordedById" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "tenantId" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_expense_categories_tenant_name" ON "expense_categories" ("tenantId", "name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_expense_vendors_tenant_name" ON "expense_vendors" ("tenantId", "name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expense_categories_tenant" ON "expense_categories" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expense_vendors_tenant" ON "expense_vendors" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_tenant" ON "expenses" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_category" ON "expenses" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_vendor" ON "expenses" ("vendorId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_status" ON "expenses" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_session" ON "expenses" ("sessionId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_section" ON "expenses" ("schoolSectionId")`);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_category"
      FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_vendor"
      FOREIGN KEY ("vendorId") REFERENCES "expense_vendors"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_session"
      FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_school_section"
      FOREIGN KEY ("schoolSectionId") REFERENCES "school_sections"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_approved_by"
      FOREIGN KEY ("approvedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "expenses"
      ADD CONSTRAINT "FK_expenses_recorded_by"
      FOREIGN KEY ("recordedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_recorded_by"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_approved_by"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_school_section"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_session"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_vendor"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_vendors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_categories"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."expenses_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."expenses_status_enum"`);
  }
}
