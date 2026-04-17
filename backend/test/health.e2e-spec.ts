/// <reference types="jest" />
/**
 * @jest-environment node
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Module Health Checks (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); // Defaulting to v1 for test
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET) - Check system health', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
  });

  it('/api/v1 (GET) - Check base route', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200);
  });
});
