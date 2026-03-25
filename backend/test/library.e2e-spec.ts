/// <reference types="jest" />
/**
 * @jest-environment node
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LibraryModule } from '../src/modules/library/library.module';
import { Book } from '../src/modules/library/entities/book.entity';
import { Author } from '../src/modules/library/entities/author.entity';
import { Category } from '../src/modules/library/entities/category.entity';
import { BookCopy } from '../src/modules/library/entities/book-copy.entity';
import { Loan } from '../src/modules/library/entities/loan.entity';
import { Fine } from '../src/modules/library/entities/fine.entity';

describe('Library Module E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Book, Author, Category, BookCopy, Loan, Fine],
          synchronize: true,
          dropSchema: true,
        }),
        LibraryModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('service endpoints exist (unauthenticated calls should be blocked)', async () => {
    await request(app.getHttpServer()).get('/api/v1/library/books').expect(401);
  });
});
