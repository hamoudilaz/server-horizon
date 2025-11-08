// src/api/index.ts
import { Router } from 'express';
import swapRoutes from './swap/swap.routes.js';
import userRoutes from './user/user.routes.js';
import demoRoutes from './demo/demo.routes.js';

const router = Router();

// Mount all feature routers
router.use('/', userRoutes); // Mounts /api/loadKey, /api/logout, etc.
router.use('/swap', swapRoutes); // Mounts /api/swap/buy, /api/swap/sell
router.use('/demo', demoRoutes); // Mounts /api/demo/tokens, /api/demo/buy, etc.

export default router;
