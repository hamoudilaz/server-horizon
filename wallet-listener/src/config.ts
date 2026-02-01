import { Connection } from '@solana/web3.js';
import { logger, RPC_URL, WSS_URL, REDIS_URL, NODE_ENV } from '@horizon/shared';
import { makeRedisClient } from '@horizon/shared';

// ────────────────────────────────────────────────
// 🔧 Redis Setup
// ────────────────────────────────────────────────
// Skip validation in test environment
if (NODE_ENV !== 'test' && !REDIS_URL) {
  logger.fatal('REDIS_URL is not defined');
  process.exit(1);
}

// Create mock Redis client for tests
const createMockRedisClient = () => ({
  get: async () => null,
  set: async () => 'OK',
  sAdd: async () => 1,
  sRem: async () => 1,
  sMembers: async () => [],
  del: async () => 1,
  expire: async () => 1,
  publish: async () => 1,
  on: () => {},
  connect: async () => {},
  quit: async () => {},
});

export const redisClient = NODE_ENV === 'test' ? createMockRedisClient() : makeRedisClient();

redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err?.code}`));

// ────────────────────────────────────────────────
// 🔧 Solana Setup
// ────────────────────────────────────────────────
// Skip validation in test environment
if (NODE_ENV !== 'test' && (!RPC_URL || !WSS_URL)) {
  logger.fatal('RPC_URL or WSS_URL is not defined');
  process.exit(1);
}

// Don't create real connection during tests
export const connection =
  NODE_ENV === 'test'
    ? ({} as Connection) // Mock placeholder for tests
    : new Connection(RPC_URL!, {
        wsEndpoint: WSS_URL,
        commitment: 'confirmed',
      });

// ────────────────────────────────────────────────
// 🔧 Connect Services
// ────────────────────────────────────────────────
export async function connectServices() {
  // Skip connection in test environment
  if (NODE_ENV === 'test') {
    logger.info('Skipping service connections in test environment');
    return;
  }

  try {
    await redisClient.connect();
    logger.info('Redis client connected');
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to Redis');
    process.exit(1);
  }
}
