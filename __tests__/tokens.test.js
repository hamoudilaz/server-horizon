import request from 'supertest';
import app from '../server.js';

jest.unstable_mockModule('../helpers/constants.js', () => ({
    connection: {}  // prevent crash on startup
}));


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
