
import Fastify from 'fastify';
import { buyHandler, sellHandler, loadWallet } from '../handlers/swap.js';
import { demoBuyhandler, demoSellHandler, getSessionState, startDemo, validateDemoSession } from '../utils/demo/buy.js';
import { validateSession } from '../handlers/swap.js';

import { demoFetchTokens } from '../utils/demo/simulate.js';
import { handleAmount, handleLogout, refreshBalance, fetchTokens } from '../handlers/handleActions.js';

const app = Fastify({ logger: false });

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
app.get('/api/demo/tokens', demoFetchTokens);

app.post('/demo/buy', demoBuyhandler);

app.post('/demo/sell', demoSellHandler);

app.post('/api/start/demo', startDemo);

app.get('/api/session/demo/state', getSessionState);

app.get('/api/session/demo', { preHandler: validateDemoSession }, async (req, reply) => {
    console.log(req.user)
    reply.send({
        valid: true,
        amount: req.user
    });
});

export default app