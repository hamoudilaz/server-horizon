import request from 'supertest';
import { jest } from '@jest/globals';
import { testPrivKey } from './config/constant.js';
import app from '../src/app.js';

describe('GET /api/tokens', () => {
  let cookie: string;

  beforeAll(async () => {
    // Authenticate to get a valid session cookie
    const loadKeyRes = await request(app).post('/api/loadKey').send({ key: testPrivKey });
    cookie = loadKeyRes.headers['set-cookie'];
  });

  it('should return array of tokens', async () => {
    const cookieHeader = Array.isArray(cookie) ? cookie.join('; ') : cookie;
    const res = await request(app).get('/api/tokens').set('Cookie', cookieHeader);

    // The mock in jest.setup.ts returns an empty map {} by default
    // The controller then sends Object.values({}), which is []
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
