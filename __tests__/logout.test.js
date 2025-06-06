import request from 'supertest';
import { testPrivKey } from '../config/constant.js';
jest.mock('../helpers/constants.js');
jest.mock('../engine/execute.js');

const app = (await import('../server.js')).default;




describe('POST /api/logout', () => {
    let cookie;
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



    it('should return error if session ID is invalid or not supplied', async () => {
        const res = await request(app.server).post('/api/logout').set('Cookie', cookie);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Logged out');
    });

    it('should return error if session ID is invalid or not supplied', async () => {
        const res = await request(app.server).post('/api/logout')
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid or missing session ID');
    });


});
