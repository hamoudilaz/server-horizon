import { testPrivKey, testPubKey } from '../config/constant.js';
import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

const app = (await import('../server.js')).default;

describe('POST /api/loadKey', () => {
  let cookie: string;
  beforeAll(async () => {
    await app.ready();

    const res = await request(app.server)
      .post('/api/loadKey')
      .set('Content-Type', 'application/json')
      .send({ key: testPrivKey });

    cookie = res.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 if no session cookie', async () => {
    const res = await request(app.server).get('/api/session');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid session');
  });

  it('should return pubKey if session is valid', async () => {
    const res = await request(app.server).get('/api/session').set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pubKey', testPubKey);
  });
});
