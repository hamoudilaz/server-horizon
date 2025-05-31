
import Fastify from 'fastify';
import { buyHandler, sellHandler, loadWallet } from '../handlers/swap.js';
import { tokens, refreshTokenPrices } from '../helpers/websocket.js';
import { sessions, validateSession } from '../handlers/swap.js';


const fastify = Fastify({ logger: false });

fastify.post('/buy', { preHandler: validateSession }, buyHandler);

fastify.post('/sell', { preHandler: validateSession }, sellHandler);




fastify.get('/api/tokens', async (request, reply) => {
    reply.send(Object.values(tokens));
});

fastify.get('/api/balance/', async (request, reply) => {
    await refreshTokenPrices();
    return reply.send({ tokens });
});

fastify.post('/api/loadKey', loadWallet);


fastify.get('/api/session', { preHandler: validateSession }, async (req, reply) => {
    reply.send({ pubKey: req.user.pubKey });
});


fastify.post('/api/logout', async (request, reply) => {
    const sessionId = request.cookies.session;
    if (sessionId) sessions.delete(sessionId);

    reply
        .clearCookie('session', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
        })
        .code(200)
        .send({ message: 'Logged out' });
});



export default fastify