// src/services/redis/trackedTokens.ts
import { redisClient } from '../../config/redis.js';
import { BroadcastedToken } from '../../core/types/interfaces.js';
import logger from '../../config/logger.js';

type TokenMap = { [mint: string]: BroadcastedToken };
const TOKEN_KEY_PREFIX = 'tokens:';

/**
 * Initializes the token tracking for a user (on login).
 */
export async function initTrackedTokens(pubKey: string): Promise<void> {
  await redisClient.set(`${TOKEN_KEY_PREFIX}${pubKey}`, JSON.stringify({}));
}

/**
 * Deletes all tracked tokens for a user (on logout).
 */
export async function deleteTrackedTokens(pubKey: string): Promise<void> {
  await redisClient.del(`${TOKEN_KEY_PREFIX}${pubKey}`);
}

/**
 * Retrieves the full map of tracked tokens for a user.
 * Returns null if the user isn't being tracked (e.g., logged out).
 */
export async function getTrackedTokens(pubKey: string): Promise<TokenMap | null> {
  try {
    const data = await redisClient.get(`${TOKEN_KEY_PREFIX}${pubKey}`);
    // Return parsed data if exists, otherwise null
    return data ? (JSON.parse(data) as TokenMap) : null;
  } catch (err) {
    logger.error({ err, pubKey }, 'Failed to getTrackedTokens from Redis');
    return null;
  }
}

/**
 * Updates or adds a single token for a user.
 * This is a read-modify-write operation. For this app's model
 * (one user, one log stream), this is perfectly safe.
 */
export async function updateTrackedToken(pubKey: string, mint: string, tokenData: BroadcastedToken): Promise<void> {
  try {
    const tokens = (await getTrackedTokens(pubKey)) ?? {};
    tokens[mint] = tokenData;
    await redisClient.set(`${TOKEN_KEY_PREFIX}${pubKey}`, JSON.stringify(tokens));
  } catch (err) {
    logger.error({ err, pubKey, mint }, 'Failed to updateTrackedToken in Redis');
  }
}

/**
 * Removes a single token from a user's map.
 */
export async function removeTrackedToken(pubKey: string, mint: string): Promise<void> {
  try {
    const tokens = await getTrackedTokens(pubKey);
    if (!tokens) return;
    delete tokens[mint];
    await redisClient.set(`${TOKEN_KEY_PREFIX}${pubKey}`, JSON.stringify(tokens));
  } catch (err) {
    logger.error({ err, pubKey, mint }, 'Failed to removeTrackedToken in Redis');
  }
}
