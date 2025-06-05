import { jest } from '@jest/globals';

import '../config/mockGlobals.js';
import request from 'supertest';

const app = (await import('../server.js')).default;

describe('GET /api/tokens', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return array of tokens', async () => {
        const res = await request(app.server).get('/api/tokens');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
