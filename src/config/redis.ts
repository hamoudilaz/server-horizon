// src/config/redis.ts
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import logger from './logger.js';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  logger.fatal('REDIS_URL is not defined in environment variables');
  process.exit(1);
}

// 1. Main Client (for sessions, GET/SET, and Publishing)
export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err?.code}`));
redisClient.on('connect', () => logger.info('Redis client connected'));

// 2. Subscriber Client (must be separate for Pub/Sub mode)
export const pubSubClient = redisClient.duplicate();
pubSubClient.on('error', (err) => logger.error(`Redis Pub/Sub Client Error: ${err?.code}`));
pubSubClient.on('connect', () => logger.info('Redis Pub/Sub client connected'));

// 3. Connect clients
try {
  // Use Promise.all to connect both clients concurrently
  await Promise.all([redisClient.connect(), pubSubClient.connect()]);
} catch (err) {
  logger.fatal({ err }, 'Failed to connect to Redis');
  process.exit(1);
}

// 4. Session Store
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'session:',
});
