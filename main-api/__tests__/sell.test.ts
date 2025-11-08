import { testPrivKey, validSellBody } from './config/constant.js';
import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js';

// --- MOCKS ---
jest.unstable_mockModule('../src/services/engine/execute.js', () => ({
  swap: jest.fn(() => Promise.resolve({ result: 'mock-tx-signature-SELL' })),
}));
jest.unstable_mockModule('../src/services/engine/bloxroute.js', () => ({
  swapBloxroute: jest.fn(() => Promise.resolve({ result: 'mock-tx-signature-SELL' })),
}));
// --- END MOCKS ---

describe('POST /api/sell', () => {
  let cookie: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/loadKey').send({ key: testPrivKey });
    cookie = res.headers['set-cookie'];
  });

  afterAll(() => {
    // No app.close() needed
  });

  it('should return 400 if mint is not a string between 43-44 characters', async () => {
    const res = await request(app)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, outputMint: 'invalidMint' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Mint must be a string and between 43-44 characters');
  });

  it('should return 400 if fee is not a number', async () => {
    const res = await request(app)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, fee: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid request, Fee must be a finite number.');
  });

  it('should return 400 if jitoFee is not a number', async () => {
    const res = await request(app)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, jitoFee: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid PrioFee type');
  });

  it('should return 400 if amount is not a number', async () => {
    const res = await request(app)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, amount: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Amount must be a number between 1 - 100');
  });

  it('should return 400 if slippage is not a number', async () => {
    const res = await request(app)
      .post('/api/sell')
      .set('Cookie', cookie)
      .send({ ...validSellBody, slippage: 'not-a-number' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Slippage must be a number between 0.01 - 100');
  });
});
