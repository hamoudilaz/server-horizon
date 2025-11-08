import { RedisStore } from 'connect-redis';
import { makeRedisClient, logger } from '@horizon/shared';

// 1️⃣ Create both clients (main + Pub/Sub)
export const redisClient = makeRedisClient();
export const pubSubClient = redisClient.duplicate();

// 2️⃣ Wire up events for both
redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err?.code}`));
redisClient.on('connect', () => logger.info('Redis client connected'));

pubSubClient.on('error', (err) => logger.error(`Redis Pub/Sub Client Error: ${err?.code}`));
pubSubClient.on('connect', () => logger.info('Redis Pub/Sub client connected'));

// 3️⃣ Connect both clients concurrently
try {
  await Promise.all([redisClient.connect(), pubSubClient.connect()]);
  logger.info('Redis clients connected');
} catch (err) {
  logger.fatal({ err }, 'Failed to connect to Redis');
  process.exit(1);
}

// 4️⃣ Session Store
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'session:',
});
