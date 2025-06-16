import { buyHandler, sellHandler, loadWallet } from '../handlers/swap.js';
import {
  demoBuyhandler,
  demoSellHandler,
  fetchDemoTokens,
  getSessionState,
  startDemo,
  validateDemoSession,
  resetDemo,
} from '../utils/demo/buy.js';
import { validateSession } from '../handlers/swap.js';

import {
  handleAmount,
  handleLogout,
  getPortfolio,
  fetchTokens,
} from '../handlers/handleActions.js';
import { FastifyInstance } from 'fastify';
import { BuyBody, SellBody } from '../types/interfaces.js';

export default function registerRoutes(app: FastifyInstance) {
  app.post<{ Body: BuyBody }>('/api/buy', { preHandler: validateSession }, buyHandler);

  app.post<{ Body: SellBody }>('/api/sell', { preHandler: validateSession }, sellHandler);

  app.get('/api/balance', { preHandler: validateSession }, getPortfolio);

  app.post('/api/loadKey', loadWallet);

  app.get('/api/session', { preHandler: validateSession }, async (req, reply) => {
    // console.log('On last handler /session:', req.session);
    if (!req.session.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }
    reply.status(200).send({ pubKey: req.session.user.pubKey });
  });

  app.get('/api/tokens', fetchTokens);

  app.post('/api/logout', handleLogout);

  app.get('/api/amount', { preHandler: validateSession }, handleAmount);

  // DEMO ROUTES
  app.get('/api/demo/tokens', { preHandler: validateDemoSession }, fetchDemoTokens);

  app.post<{ Body: BuyBody }>('/api/demo/buy', { preHandler: validateDemoSession }, demoBuyhandler);

  app.post<{ Body: SellBody }>(
    '/api/demo/sell',
    { preHandler: validateDemoSession },
    demoSellHandler
  );

  app.post('/api/start/demo', startDemo);

  app.post('/api/demo/reset', resetDemo);

  app.get('/api/session/demo/state', { preHandler: validateDemoSession }, getSessionState);

  app.get('/api/session/demo', { preHandler: validateDemoSession }, async (req, reply) => {
    reply.send({
      valid: true,
      amount: req.user,
    });
  });
}
