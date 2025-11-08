import { testPrivKey, testPubKey } from './config/constant.js';
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js';

describe('POST /api/loadKey', () => {
  // No beforeAll or afterAll needed for app.ready/close

  it('should return correct error when sending wrong body value', async () => {
    const res = await request(app)
      .post('/api/loadKey')
      .set('Content-Type', 'application/json')
      .send({ wrong: testPrivKey });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing key in body');
  });

  it('should return correct error when sending invalid privKey', async () => {
    const res = await request(app)
      .post('/api/loadKey')
      .set('Content-Type', 'application/json')
      .send({ key: 'INVALIDKEY00000000000000' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid key format');
  });

  it('should load wallet and return pubKey and set cookie', async () => {
    const res = await request(app)
      .post('/api/loadKey')
      .set('Content-Type', 'application/json')
      .send({ key: testPrivKey });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pubKey', testPubKey);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
