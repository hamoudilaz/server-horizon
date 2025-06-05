
import Fastify from 'fastify';
import { buyHandler, sellHandler, loadWallet } from '../handlers/swap.js';
import { tokens, refreshTokenPrices } from '../helpers/websocket.js';
import { sessions, validateSession } from '../handlers/swap.js';


const app = Fastify({ logger: false });

app.post('/buy', { preHandler: validateSession }, buyHandler);

app.post('/sell', { preHandler: validateSession }, sellHandler);




app.get('/api/tokens', async (request, reply) => {
    reply.send(Object.values(tokens));
});

app.get('/api/balance/', async (request, reply) => {
    const tokens = await refreshTokenPrices();
    if (!tokens) return reply.send({ error: "No tokens available" })
    return reply.send({ tokens });
});

app.post('/api/loadKey', loadWallet);


app.get('/api/session', { preHandler: validateSession }, async (req, reply) => {
    reply.status(200).send({ pubKey: req.user.pubKey });
});


app.post('/api/logout', async (request, reply) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return reply.status(400).send({ error: "Invalid or missing session ID" })

    sessions.delete(sessionId);

    reply
        .clearCookie('session', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
        })
        .code(200)
        .send({ message: 'Logged out' });
});



export default app