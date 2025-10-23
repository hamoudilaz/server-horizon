import request from 'supertest';
import { jest } from '@jest/globals';
import { testPrivKey } from '../config/constant.js';

jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

const app = (await import('../server.js')).default;

describe('GET /api/balance', () => {
  let cookie: string;

  beforeAll(async () => {
    await app.ready();
    const res = await request(app.server).post('/api/loadKey').send({ key: testPrivKey });
    cookie = res.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app.server).get('/api/balance');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid session');
  });

  it('should return a portfolio and solPrice if authenticated', async () => {
    const res = await request(app.server).get('/api/balance').set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('portfolio');
    expect(res.body).toHaveProperty('solPrice');
    expect(Array.isArray(res.body.portfolio)).toBe(true);
  });
});
