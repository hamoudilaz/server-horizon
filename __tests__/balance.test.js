import request from 'supertest';
import app from '../server.js';

jest.unstable_mockModule('../helpers/constants.js', () => ({
    connection: {}  // prevent crash on startup
}));

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
