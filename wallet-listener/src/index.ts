// src/index.ts
import { connectServices } from './config.js';
import { logger } from '@horizon/shared';
import { reconcileWallets } from './core/listenerManager.js';
import { pluginsLoader } from './plugins/index.js';

const RECONCILE_INTERVAL_MS = 5000;

async function main() {
  logger.info('Starting Wallet Listener Service...');

  await connectServices();

  await reconcileWallets();

  pluginsLoader();
  setInterval(reconcileWallets, RECONCILE_INTERVAL_MS);

  logger.info(`Service started. Reconciling every ${RECONCILE_INTERVAL_MS}ms.`);
}

main().catch((err) => {
  logger.fatal({ err }, 'Service failed to start');
  process.exit(1);
});
