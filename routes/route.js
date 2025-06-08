
import Fastify from 'fastify';
import { buyHandler, sellHandler, loadWallet } from '../handlers/swap.js';
import { validateSession } from '../handlers/swap.js';

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





export default app