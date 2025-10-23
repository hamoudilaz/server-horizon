import request from 'supertest';
import { jest } from '@jest/globals';
import { testPrivKey } from '../config/constant.js';
jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

const app = (await import('../server.js')).default;

describe('GET /api/tokens', () => {
  let cookie: string;
  beforeAll(async () => {
    await app.ready();
    // Authenticate to get a valid session cookie
    const loadKeyRes = await request(app.server).post('/api/loadKey').send({ key: testPrivKey }); // Replace with a valid test key if needed
    cookie = loadKeyRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return array of tokens', async () => {
    const cookieHeader = Array.isArray(cookie) ? cookie.join('; ') : cookie;
    const res = await request(app.server).get('/api/tokens').set('Cookie', cookieHeader);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
