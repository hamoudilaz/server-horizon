import { jest } from '@jest/globals';

import { mockGlobals } from '../config/mockGlobals.js';
await mockGlobals();

import request from 'supertest';

const app = (await import('../server.js')).default;

describe('GET /api/balance/', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return tokens if available', async () => {
        const res = await request(app.server).get('/api/balance/');

        if (res.body.tokens) {
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.tokens)).toBe(true);
        } else {
            expect(res.body).toHaveProperty('error', "No tokens available");
        }
    });


    it('should return error if no tokens available', async () => {
        const original = app.refreshTokenPrices;
        app.refreshTokenPrices = async () => null;

        const res = await request(app.server).get('/api/balance/');
        expect(res.body).toHaveProperty('error', 'No tokens available');

        app.refreshTokenPrices = original;
    });
});
