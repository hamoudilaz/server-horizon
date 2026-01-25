// src/services/redis/trackedTokens.ts
import { redisClient } from '../../config/redis.js';
import { BroadcastedToken, logger, WS_MESSAGES_CHANNEL } from '@horizon/shared';

type TokenMap = { [mint: string]: BroadcastedToken };

const TOKEN_KEY_PREFIX = 'tokens:';
const ACTIVE_WALLETS_KEY = 'active_wallets';
const SOL_PRICE_KEY = 'solPrice';

/**
 * Initializes the token tracking for a user (on login).
 */
export async function initTrackedTokens(pubKey: string): Promise<void> {
  await redisClient.set(`${TOKEN_KEY_PREFIX}${pubKey}`, JSON.stringify({}), { EX: 86400 }); // 1 day TTL
  await redisClient.sAdd(ACTIVE_WALLETS_KEY, pubKey);
}

/**
 * Deletes all tracked tokens for a user (on logout).
 */
export async function deleteTrackedTokens(pubKey: string): Promise<void> {
  await redisClient.sRem(ACTIVE_WALLETS_KEY, pubKey);
  await redisClient.del(`${TOKEN_KEY_PREFIX}${pubKey}`);
}

/**
 * Retrieves the full map of tracked tokens for a user.
 * Returns null if the user isn't being tracked (e.g., logged out).
 */
export async function getTrackedTokens(pubKey: string): Promise<TokenMap | null> {
  try {
    const data = await redisClient.get(`${TOKEN_KEY_PREFIX}${pubKey}`);

    return data ? (JSON.parse(data) as TokenMap) : null;
  } catch (err) {
    logger.error({ err, pubKey }, 'Failed to getTrackedTokens from Redis');
    return null;
  }
}

export async function getSolPriceFromRedis(): Promise<number | null> {
  return Number(await redisClient.get(SOL_PRICE_KEY));
}

/**
 * Removes a single token from a user's map.
 */
export async function removeWronglyTrackedToken(pubKey: string, mint: string, trackedTokens: TokenMap): Promise<void> {
  try {
    delete trackedTokens[mint];

    await redisClient.set(`tokens:${pubKey}`, JSON.stringify(trackedTokens));

    // Broadcast removal to user via WebSocket
    const message = JSON.stringify({ pubKey, data: { tokenMint: mint, removed: true } });
    await redisClient.publish(WS_MESSAGES_CHANNEL, message);
  } catch (err) {
    logger.error({ err, pubKey, mint }, 'Failed to removeTrackedToken in Redis');
  }
}
