// src/api/user/user.routes.ts
import { Router } from 'express';
import {
  loadWallet,
  handleAmount,
  handleLogout,
  getPortfolio,
  getSingleToken,
  fetchTokens,
  cleanWalletHandler,
} from './user.controller.js';
import { validateSession } from '../../core/middlewares/swap.middleware.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

router.post('/loadKey', loadWallet);
router.post('/logout', handleLogout);
router.get('/balance', validateSession, getPortfolio);
router.post('/single/balance', validateSession, getSingleToken);
router.get('/tokens', fetchTokens);
router.get('/amount', validateSession, handleAmount);
router.post('/cleanup', validateSession, cleanWalletHandler);

router.get('/session', validateSession, (req, res) => {
  res.status(200).json({ pubKey: req.session.user!.pubKey });
});

export default router;
