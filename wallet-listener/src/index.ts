// src/index.ts
import { connectServices, redisClient } from './config.js';
import { logger } from '@horizon/shared';
import { reconcileWallets, cleanupAllSubscriptions } from './core/listenerManager.js';
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

async function gracefulShutdown(signal: string) {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  try {
    await cleanupAllSubscriptions();

    await redisClient.quit();
    logger.info('Redis client disconnected. Exiting.');

    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// Listen for Ctrl+C
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Listen for standard 'kill' command
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
