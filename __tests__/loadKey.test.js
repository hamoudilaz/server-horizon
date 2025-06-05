import request from 'supertest';
import app from '../server.js';
import { testPrivKey, testPubKey } from '../config/constant.js';

jest.unstable_mockModule('../helpers/constants.js', () => ({
    connection: {}  // prevent crash on startup
}));

describe('POST /api/loadKey', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return correct error when sending wrong body value', async () => {
        const res = await request(app.server)
            .post('/api/loadKey')
            .set('Content-Type', 'application/json')
            .send({ wrong: testPrivKey });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', "Missing key in body");
    });

    it('should return correct error when sending invalid privKey', async () => {
        const res = await request(app.server)
            .post('/api/loadKey')
            .set('Content-Type', 'application/json')
            .send({ key: "INVALIDKEY00000000000000" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', "Non-base58 character");
    });



    it('should load wallet and return pubKey of given bs58 encoded private key and set UUID session', async () => {
        const res = await request(app.server)
            .post('/api/loadKey')
            .set('Content-Type', 'application/json')
            .send({ key: testPrivKey });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('pubKey', testPubKey);
        expect(res.headers['set-cookie']).toBeDefined();

    });
});
