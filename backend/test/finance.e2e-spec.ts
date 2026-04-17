/// <reference types="jest" />
/**
 * @jest-environment node
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Finance Flow Security E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Finance Modules Unauthenticated Access', () => {
    it('/api/v1/finance/debtors (GET) should block unauthorized request', () => {
      return request(app.getHttpServer())
        .get('/api/v1/finance/debtors')
        .expect(401);
    });

    it('/api/v1/finance/payments (GET) should block unauthorized request', () => {
      return request(app.getHttpServer())
        .get('/api/v1/finance/payments')
        .expect(401);
    });

    it('/api/v1/finance/structures (GET) should block unauthorized request', () => {
      return request(app.getHttpServer())
        .get('/api/v1/finance/structures')
        .expect(401);
    });
  });
});
