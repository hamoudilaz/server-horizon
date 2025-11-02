// src/api/swap/swap.routes.ts
import { Router } from 'express';
import { buyHandler, sellHandler } from './swap.controller.js';
import { validateSession } from './swap.middleware.js';

const router = Router();

router.post('/buy', validateSession, buyHandler);
router.post('/sell', validateSession, sellHandler);

export default router;
