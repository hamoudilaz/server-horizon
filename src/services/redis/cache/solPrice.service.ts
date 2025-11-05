// src/services/redis/cache/solPrice.service.ts
import { redisClient } from '../../../config/redis.js';
import logger from '../../../config/logger.js';
import { getSolPrice } from '../../external/price.service.js';
import { setIntervalAsync } from 'set-interval-async/dynamic';
import { SOL_PRICE_KEY, SOL_PRICE_TTL } from '../../../config/constants.js'; // Use central constants

/**
 * Fetches and updates the SOL price in Redis.
 * This function can be called on its own.
 */
async function updateSolPrice(): Promise<void> {
  try {
    const solPrice = await getSolPrice();
    if (solPrice > 0) {
      // Basic validation
      await redisClient.set(SOL_PRICE_KEY, solPrice.toString(), {
        EX: SOL_PRICE_TTL, // Set the Time-To-Live
      });
      logger.info(`Updated SOL price in Redis: ${solPrice}`);
    } else {
      logger.warn('Fetched SOL price was 0 or invalid, not updating cache.');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to update SOL price in Redis');
  }
}

/**
 * Starts the SOL price update service.
 * Runs immediately on startup and then every 5 minutes.
 */
export function startSolPriceUpdater(): void {
  logger.info('Starting SOL price updater service...');

  // 1. Run immediately on boot.
  // We don't await this; let it run in the background.
  // Server startup shouldn't be blocked by this.
  updateSolPrice();

  // 2. Schedule all subsequent updates
  setIntervalAsync(async () => {
    await updateSolPrice();
  }, SOL_PRICE_TTL * 1000); // e.g., 300 * 1000 = 5 minutes
}
