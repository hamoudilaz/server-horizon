import { Connection } from '@solana/web3.js';
import { logger, RPC_URL, WSS_URL, REDIS_URL } from '@horizon/shared';
import { makeRedisClient } from '@horizon/shared';

// ────────────────────────────────────────────────
// 🔧 Redis Setup
// ────────────────────────────────────────────────
if (!REDIS_URL) {
  logger.fatal('REDIS_URL is not defined');
  process.exit(1);
}

export const redisClient = makeRedisClient();

redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err?.code}`));

// ────────────────────────────────────────────────
// 🔧 Solana Setup
// ────────────────────────────────────────────────
if (!RPC_URL || !WSS_URL) {
  logger.fatal('RPC_URL or WSS_URL is not defined');
  process.exit(1);
}

export const connection = new Connection(RPC_URL, {
  wsEndpoint: WSS_URL,
  commitment: 'confirmed',
});

// ────────────────────────────────────────────────
// 🔧 Connect Services
// ────────────────────────────────────────────────
export async function connectServices() {
  try {
    await redisClient.connect();
    logger.info('Redis client connected');
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to Redis');
    process.exit(1);
  }
}
