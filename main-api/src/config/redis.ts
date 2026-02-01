import { RedisStore } from 'connect-redis';
import { makeRedisClient, logger, NODE_ENV } from '@horizon/shared';

// 1️⃣ Create both clients (main + Pub/Sub) - use memory-only mocks in test
const createMockRedisClient = () => ({
  get: async () => null,
  set: async () => 'OK',
  sAdd: async () => 1,
  sRem: async () => 1,
  del: async () => 1,
  publish: async () => 1,
  on: () => {},
  connect: async () => {},
  quit: async () => {},
  duplicate: () => createMockRedisClient(),
});

export const redisClient = NODE_ENV === 'test' ? createMockRedisClient() : makeRedisClient();
export const pubSubClient = NODE_ENV === 'test' ? createMockRedisClient() : redisClient.duplicate();

// 2️⃣ Wire up events for both
redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err?.code}`));
redisClient.on('connect', () => logger.info('Redis client connected'));

pubSubClient.on('error', (err) => logger.error(`Redis Pub/Sub Client Error: ${err?.code}`));
pubSubClient.on('connect', () => logger.info('Redis Pub/Sub client connected'));

// 3️⃣ Connect both clients concurrently (wrapped in function to avoid top-level await issues in tests)
async function connectRedis() {
  if (NODE_ENV === 'test') {
    logger.info('Skipping Redis connection in test environment');
    return;
  }

  try {
    await Promise.all([redisClient.connect(), pubSubClient.connect()]);
    logger.info('Redis clients connected');
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to Redis');
    process.exit(1);
  }
}

// Auto-connect unless in test mode
if (NODE_ENV !== 'test') {
  connectRedis();
}

// 4️⃣ Session Store
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'session:',
});
