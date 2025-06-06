import request from 'supertest';
jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

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
