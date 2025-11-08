import request from 'supertest';
import { testPrivKey } from './config/constant.js';
import { jest } from '@jest/globals';
import app from '../src/app.js';

describe('POST /api/logout', () => {
  let cookie: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/loadKey')
      .set('Content-Type', 'application/json')
      .send({ key: testPrivKey });

    cookie = res.headers['set-cookie'];
  });

  it('should logout successfully with a valid session', async () => {
    const res = await request(app).post('/api/logout').set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out');
  });

  it('should return error if no session ID is supplied', async () => {
    const res = await request(app).post('/api/logout');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid or missing session ID');
  });
});
