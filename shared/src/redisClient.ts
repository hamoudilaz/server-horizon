// backend/shared/src/redisClient.ts
import { createClient } from '@redis/client';
import { REDIS_URL } from './env.js';
import { logger } from './logger.js';

export function makeRedisClient() {
  if (!REDIS_URL) {
    logger.fatal('REDIS_URL is missing');
    process.exit(1);
  }

  const client = createClient({ url: REDIS_URL });

  client.on('connect', () => logger.info('Redis client connected'));
  client.on('error', (err) => logger.error(`Redis Client Error: ${err?.code}`));

  return client;
}
