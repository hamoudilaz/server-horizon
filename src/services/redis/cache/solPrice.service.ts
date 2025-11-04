import { SOL_PRICE_KEY, SOL_PRICE_TTL } from '../../../config/constants.js';
import logger from '../../../config/logger.js';
import { redisClient } from '../../../config/redis.js';
import { getSolPrice } from '../../external/price.service.js';

// fetch + cache every 5 minutes
export async function refreshSolPrice(): Promise<void> {
  try {
    const solPrice = await getSolPrice();
    console.log('in cache func', solPrice);
    await redisClient.set(SOL_PRICE_KEY, solPrice.toString(), { EX: SOL_PRICE_TTL });
    logger.info({ solPrice }, 'Refreshed SOL price in Redis');
  } catch (err) {
    logger.error({ err }, 'Failed to refresh SOL price');
  }
}

// start immediately, then repeat
await refreshSolPrice();
setInterval(refreshSolPrice, SOL_PRICE_TTL * 1000);
