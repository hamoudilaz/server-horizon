// src/services/redis/cache/solPrice.service.ts

import { setIntervalAsync } from 'set-interval-async/dynamic';
import { redisClient } from '../config.js';
import { logger, SOL_PRICE_KEY, SOL_PRICE_TTL, getSolPrice } from '@horizon/shared';

async function updateSolPrice(): Promise<void> {
  try {
    const solPrice = await getSolPrice();
    if (solPrice > 0) {
      await redisClient.set(SOL_PRICE_KEY, solPrice.toString(), {
        EX: SOL_PRICE_TTL,
      });
      logger.info(`Updated SOL price in Redis: ${solPrice}`);
    } else {
      logger.warn('Fetched SOL price was 0 or invalid, not updating cache.');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to update SOL price in Redis');
  }
}

export function startSolPriceUpdater(): void {
  logger.info('Starting SOL price updater service...');

  void updateSolPrice();

  setIntervalAsync(async () => {
    await updateSolPrice();
  }, SOL_PRICE_TTL * 1000); // e.g., 300 * 1000 = 5 minutes
}
