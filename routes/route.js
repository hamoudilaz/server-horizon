
import Fastify from 'fastify';
import { buyHandler, sellHandler, loadWallet } from '../handlers/swap.js';
import { demoBuyhandler, demoSellHandler, fetchDemoTokens, getSessionState, startDemo, validateDemoSession } from '../utils/demo/buy.js';
import { validateSession } from '../handlers/swap.js';

import { handleAmount, handleLogout, refreshBalance, fetchTokens } from '../handlers/handleActions.js';
import dotenv from "dotenv"
dotenv.config()

const app = Fastify({
    logger: false,
    trustProxy: true
});


app.addHook('onRequest', (req, reply, done) => {
    reply.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL_CORS);
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    done();
});

app.post('/buy', { preHandler: validateSession }, buyHandler);

app.post('/sell', { preHandler: validateSession }, sellHandler);


app.get('/api/balance/', refreshBalance);

app.post('/api/loadKey', loadWallet);


app.get('/api/session', { preHandler: validateSession }, async (req, reply) => {
    reply.status(200).send({ pubKey: req.user.pubKey });
});

app.get('/api/tokens', fetchTokens);



app.post('/api/logout', handleLogout);

app.get('/api/amount', { preHandler: validateSession }, handleAmount);




// DEMO ROUTES
app.get('/api/demo/tokens', fetchDemoTokens); // Also protect this

app.post('/demo/buy', demoBuyhandler); // Add preHandler

app.post('/demo/sell', demoSellHandler); // Add preHandler

app.post('/api/start/demo', startDemo);

app.get('/api/session/demo/state', getSessionState); // Also protect this

app.get('/api/session/demo', { preHandler: validateDemoSession }, async (req, reply) => {
    reply.send({
        valid: true,
        amount: req.user
    });
});

export default app