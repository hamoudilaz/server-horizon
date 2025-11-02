// src/api/demo/demo.routes.ts
import { Router } from 'express';
import {
  demoBuyhandler,
  demoSellHandler,
  fetchDemoTokens,
  getSessionState,
  startDemo,
  resetDemo,
} from './demo.controller.js';
import { validateDemoSession } from './demo.middleware.js';

const router = Router();
// /api/demo +

router.get('/tokens', validateDemoSession, fetchDemoTokens);
router.post('/buy', validateDemoSession, demoBuyhandler);
router.post('/sell', validateDemoSession, demoSellHandler);
router.post('/start', startDemo);
router.post('/reset', resetDemo);
router.get('/session/state', validateDemoSession, getSessionState);

router.get('/session', validateDemoSession, (req, res) => {
  res.json({ valid: true, amount: req.user });
});

export default router;
