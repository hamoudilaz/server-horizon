// src/listenerManager.ts
import { connection, redisClient } from '../config.js';
import { logger, DEFAULT_IMG, ACTIVE_WALLETS_KEY, getTotalOwnedTokens, tokenLogo } from '@horizon/shared';
import { PublicKey, Logs } from '@solana/web3.js';
import {
  getTx,
  updateTrackedToken,
  removeTrackedToken,
  publishToUser,
  getTrackedTokens,
  checkIfIsSwap,
} from './solanaUtils.js';
import { randomUUID } from 'crypto';

export const instanceId = randomUUID();

// This local map stores which wallets this *specific container* is listening to.
// Maps: pubKey -> solanaSubscriptionId
const activeSubscriptions = new Map<string, number>();

/**
 * The callback function that fires on every log event.
 * This is the core logic from your old listenToWallets function.
 */
async function onLogEventCallback(pubKey: string, event: Logs) {
  try {
    const signature = event.signature;

    const isSwap = await checkIfIsSwap(event.logs, pubKey);
    if (!isSwap) {
      logger.debug('Ignoring non-swap transaction');
      return { ignore: true, error: 'Is not a swap transaction' };
    }

    const res = await getTx(signature, pubKey);
    if ('error' in res) {
      logger.warn({ pubKey, signature, error: res.error }, 'Failed to decode tx from logs');
      return;
    }

    const { otherMint, tokenBalance } = res;

    const userTokens = await getTrackedTokens(pubKey);
    if (userTokens === null) {
      logger.debug({ pubKey }, 'Log received, but user is no longer tracked (logged out).');
      await removeWallet(pubKey);
      return;
    }

    let broadcastData;
    if (tokenBalance >= 3) {
      const logoData = await tokenLogo(otherMint);
      const uiTokenBalance = tokenBalance / 10 ** (logoData?.decimals ?? 6);
      const totalTokenValue = await getTotalOwnedTokens(otherMint, uiTokenBalance);

      broadcastData = {
        listToken: true,
        tokenMint: otherMint,
        tokenBalance: uiTokenBalance,
        usdValue: Number(totalTokenValue) || NaN,
        logoURI: logoData?.logoURI || DEFAULT_IMG,
        symbol: logoData?.symbol || 'No ticker',
      };
      logger.info({ pubKey, otherMint, tokenBalance }, `Updating token for wallet`);
      await updateTrackedToken(pubKey, otherMint, broadcastData);
    } else {
      // Logic for removing a token
      broadcastData = { tokenMint: otherMint, removed: true };
      logger.info({ pubKey, otherMint }, `Removing token for wallet`);
      await removeTrackedToken(pubKey, otherMint);
    }
    await publishToUser(pubKey, broadcastData);
  } catch (err) {
    logger.error({ err, pubKey }, 'Error in onLogEventCallback');
  }
}

/**
 * Subscribes to a new wallet's logs.
 */
async function addWallet(pubKey: string) {
  if (activeSubscriptions.has(pubKey)) {
    return; // Already listening
  }

  try {
    const pubKeyObj = new PublicKey(pubKey);

    const subId = await connection.onLogs(pubKeyObj, (event) => onLogEventCallback(pubKey, event), 'confirmed');

    console.log(subId);

    activeSubscriptions.set(pubKey, subId);

    logger.info({ pubKey }, 'Subscribed to wallet logs');
  } catch (err) {
    const owner = await redisClient.get(`lock:${pubKey}`);
    if (owner === instanceId) await redisClient.del(`lock:${pubKey}`);
    logger.error({ err, pubKey }, 'Failed to subscribe to wallet');
  }
}

/**
 * Unsubscribes from a wallet's logs.
 */
async function removeWallet(pubKey: string) {
  try {
    const owner = await redisClient.get(`lock:${pubKey}`);
    if (owner === instanceId) {
      await redisClient.del(`lock:${pubKey}`);
    }
    activeSubscriptions.delete(pubKey);
    logger.info({ pubKey }, 'Unsubscribed from wallet logs');
  } catch (err) {
    logger.error({ err, pubKey }, 'Failed to unsubscribe from wallet');
  }
}

/**
 * The main reconciliation loop.
 * Compares desired state (Redis) with current state (local map).
 */
export async function reconcileWallets() {
  logger.debug('Reconciling wallet subscriptions...');
  try {
    const desiredWallets = await redisClient.sMembers(ACTIVE_WALLETS_KEY);
    const desiredSet = new Set(desiredWallets);
    const currentSet = new Set(activeSubscriptions.keys());

    // 1. Subscribe to new wallets
    for (const pubKey of desiredSet) {
      if (!currentSet.has(pubKey as string)) {
        const lockAcquired = await redisClient.set(`lock:${pubKey}`, instanceId, {
          NX: true,
          EX: 30,
        });
        if (lockAcquired === 'OK') {
          await addWallet(pubKey as string);
        }
      }
    }

    // 2. Unsubscribe from old wallets
    for (const pubKey of currentSet) {
      if (!desiredSet.has(pubKey)) {
        await removeWallet(pubKey);
      }
    }

    for (const [pubKey] of activeSubscriptions) {
      try {
        const currentOwner = await redisClient.get(`lock:${pubKey}`);
        if (currentOwner === instanceId) {
          await redisClient.expire(`lock:${pubKey}`, 30);
        }
      } catch (err) {
        logger.warn({ err, pubKey }, 'Lock renewal failed');
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err: message }, 'Error during wallet reconciliation');
  }
}

/**
 * Cleans up all active subscriptions for this instance.
 * Called during a graceful shutdown.
 */
export async function cleanupAllSubscriptions() {
  logger.info(`Cleaning up ${activeSubscriptions.size} active subscriptions...`);
  const cleanupPromises: Promise<void>[] = [];

  for (const pubKey of activeSubscriptions.keys()) {
    cleanupPromises.push(removeWallet(pubKey));
  }

  await Promise.all(cleanupPromises);
  logger.info('All subscriptions cleaned up.');
}
