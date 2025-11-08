import { testPrivKey, testPubKey } from './config/constant.js';
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js';

describe('GET /api/session', () => {
  let cookie: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/loadKey')
      .set('Content-Type', 'application/json')
      .send({ key: testPrivKey });

    cookie = res.headers['set-cookie'];
  });

  it('should return 401 if no session cookie', async () => {
    const res = await request(app).get('/api/session');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid session');
  });

  it('should return pubKey if session is valid', async () => {
    const res = await request(app).get('/api/session').set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pubKey', testPubKey);
  });
});
