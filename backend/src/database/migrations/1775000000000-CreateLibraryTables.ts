import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLibraryTables1775000000000 implements MigrationInterface {
    name = 'CreateLibraryTables1775000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "authors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "bio" text, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b3a9d5c8f6d2f1a7c1a2b3c4d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c7a1d2e3f4b5a6c7d8e9f0a1b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "books" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "isbn" character varying, "publisher" character varying, "publishedDate" date, "description" text, "coverPath" character varying, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c9e8f7a6b5c4d3e2f1a0b9c8d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "book_authors" ("bookId" uuid NOT NULL, "authorId" uuid NOT NULL, CONSTRAINT "PK_book_authors" PRIMARY KEY ("bookId","authorId"))`);
        await queryRunner.query(`CREATE TABLE "book_categories" ("bookId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_book_categories" PRIMARY KEY ("bookId","categoryId"))`);
        await queryRunner.query(`CREATE TABLE "book_copies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bookId" uuid NOT NULL, "barcode" character varying, "status" character varying NOT NULL DEFAULT 'available', "location" character varying, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_book_copies" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "loans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "copyId" uuid NOT NULL, "borrowerId" uuid, "issuedAt" TIMESTAMP NOT NULL, "dueAt" TIMESTAMP NOT NULL, "returnedAt" TIMESTAMP, "status" character varying NOT NULL DEFAULT 'active', "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_loans" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loanId" uuid NOT NULL, "amount" numeric NOT NULL DEFAULT 0, "paid" boolean NOT NULL DEFAULT false, "paidAt" TIMESTAMP, "tenantId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fines" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "book_authors" ADD CONSTRAINT "FK_book_authors_book" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_authors" ADD CONSTRAINT "FK_book_authors_author" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_categories" ADD CONSTRAINT "FK_book_categories_book" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_categories" ADD CONSTRAINT "FK_book_categories_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_copies" ADD CONSTRAINT "FK_book_copies_book" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_loans_copy" FOREIGN KEY ("copyId") REFERENCES "book_copies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fines" ADD CONSTRAINT "FK_fines_loan" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fines" DROP CONSTRAINT "FK_fines_loan"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_loans_copy"`);
        await queryRunner.query(`ALTER TABLE "book_copies" DROP CONSTRAINT "FK_book_copies_book"`);
        await queryRunner.query(`ALTER TABLE "book_categories" DROP CONSTRAINT "FK_book_categories_category"`);
        await queryRunner.query(`ALTER TABLE "book_categories" DROP CONSTRAINT "FK_book_categories_book"`);
        await queryRunner.query(`ALTER TABLE "book_authors" DROP CONSTRAINT "FK_book_authors_author"`);
        await queryRunner.query(`ALTER TABLE "book_authors" DROP CONSTRAINT "FK_book_authors_book"`);
        await queryRunner.query(`DROP TABLE "fines"`);
        await queryRunner.query(`DROP TABLE "loans"`);
        await queryRunner.query(`DROP TABLE "book_copies"`);
        await queryRunner.query(`DROP TABLE "book_categories"`);
        await queryRunner.query(`DROP TABLE "book_authors"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "authors"`);
    }

}
