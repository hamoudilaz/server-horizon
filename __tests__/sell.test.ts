import { testPrivKey, validSellBody } from '../config/constant.js';
import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

const app = (await import('../server.js')).default;

describe('POST /api/sell', () => {
  let cookie: string;

  beforeAll(async () => {
    await app.ready();
    const res = await request(app.server).post('/api/loadKey').send({ key: testPrivKey });
    cookie = res.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 if mint is not a string between 43-44 characters', async () => {
    const res = await request(app.server)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, outputMint: 'invalidMint' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Mint must be a string and between 43-44 characters');
  });

  it('should return 400 if fee is not a number', async () => {
    const res = await request(app.server)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, fee: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid request, Fee must be a finite number.');
  });

  it('should return 400 if jitoFee is not a number', async () => {
    const res = await request(app.server)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, jitoFee: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid PrioFee type');
  });

  it('should return 400 if amount is not a number', async () => {
    const res = await request(app.server)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, amount: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Amount must be a number between 1 - 100');
  });

  it('should return 400 if slippage is not a number', async () => {
    const res = await request(app.server)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, slippage: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Slippage must be a number between 0.01 - 100');
  });

  //    it('should return solscan tx link if sell is successful', async () => {

  //     const res = await request(app.server)
  //         .post('/sell')
  //         .set('Cookie', cookie)
  //         .send(validSellBody);
  //     console.log(res.body)
  //     expect(res.statusCode).toBe(200);

  //     expect(res.body.message).toContain('https://solscan.io/tx/SELLTX123');
  // });
});
