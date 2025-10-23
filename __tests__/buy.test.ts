import { testPrivKey, validBody } from '../config/constant.js';
import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

const app = (await import('../server.js')).default;

describe('POST /buy', () => {
  let cookie: string;

  beforeAll(async () => {
    await app.ready();
    const res = await request(app.server).post('/api/loadKey').send({ key: testPrivKey });
    cookie = res.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 if mint is missing', async () => {
    const res = await request(app.server)
      .post('/api/buy')
      .set('Cookie', cookie)
      .send({ ...validBody, mint: 'invalidMint' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid request, Mint must be a string and between 43-44 characters');
  });

  it('should return 400 if buyAmount is too low', async () => {
    const res = await request(app.server)
      .post('/api/buy')
      .set('Cookie', cookie)
      .send({ ...validBody, buyAmount: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid request, wSOL amount must be a number between 0.000001 - 10');
  });

  it('should return 400 if buyAmount is too low', async () => {
    const res = await request(app.server)
      .post('/api/buy')
      .set('Cookie', cookie)
      .send({ ...validBody, buyAmount: null });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('amount is missing');
  });

  it('should return 400 if fee is too high', async () => {
    const res = await request(app.server)
      .post('/api/buy')
      .set('Cookie', cookie)
      .send({ ...validBody, fee: 0.5 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Too high fee!');
  });

  it('should return 400 if fee type is not a number', async () => {
    const res = await request(app.server)
      .post('/api/buy')
      .set('Cookie', cookie)
      .send({ ...validBody, fee: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid request, Fee must be a finite number.');
  });

  it('should return 400 if jitoFee is not a number', async () => {
    const res = await request(app.server)
      .post('/api/buy')
      .set('Cookie', cookie)
      .send({ ...validBody, jitoFee: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid PrioFee type');
  });
});
