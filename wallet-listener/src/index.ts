// src/index.ts
import { connectServices } from './config.js';
import { logger } from '@horizon/shared';
import { reconcileWallets } from './core/listenerManager.js';
import { pluginsLoader } from './plugins/index.js';

const RECONCILE_INTERVAL_MS = 5000;

async function main() {
  logger.info('Starting Wallet Listener Service...');

  // 1. Connect to Redis
  await connectServices();

  // 2. Run reconciliation once on startup
  await reconcileWallets();

  pluginsLoader();
  // 3. Set up the loop to run periodically
  setInterval(reconcileWallets, RECONCILE_INTERVAL_MS);

  logger.info(`Service started. Reconciling every ${RECONCILE_INTERVAL_MS}ms.`);
}

main().catch((err) => {
  logger.fatal({ err }, 'Service failed to start');
  process.exit(1);
});
