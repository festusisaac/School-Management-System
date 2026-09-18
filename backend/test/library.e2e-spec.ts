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

describe.skip('Library Module E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432', 10),
          username: process.env.DATABASE_USER || 'test_user',
          password: process.env.DATABASE_PASSWORD || 'test_password',
          database: process.env.DATABASE_NAME || 'test_db',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
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
