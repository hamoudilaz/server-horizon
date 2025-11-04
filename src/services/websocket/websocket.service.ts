import { PublicKey } from '@solana/web3.js';
import getTx from '../solana/decodeTx.js';
import { DEFAULT_IMG } from '../../config/constants.js';
import { totalOwned, tokenLogo } from '../external/price.service.js';
import logger from '../../config/logger.js';
import { getTrackedTokens, updateTrackedToken, removeTrackedToken } from '../redis/trackedTokens.js';
import { redisClient } from '../../config/redis.js';
import { connection } from '../solana/panel.js';

type BroadcastData =
  | {
      listToken: boolean;
      tokenMint: string;
      tokenBalance: number;
      usdValue: number;
      logoURI: string;
      symbol: string;
    }
  | {
      tokenMint: string;
      removed: boolean;
    };

export async function publishToUser(pubKey: string, data: BroadcastData) {
  try {
    const message = JSON.stringify({ pubKey, data });
    await redisClient.publish('ws-messages', message);
  } catch (err) {
    logger.error({ err, pubKey }, 'Failed to publish WebSocket message to Redis');
  }
}

async function listenToWallets(wallet: string) {
  try {
    connection.onLogs(
      new PublicKey(wallet),
      async (logs) => {
        const signature = logs.signature;
        const res = await getTx(signature, wallet);
        if ('error' in res) {
          logger.warn(`Failed to decode transaction from logs for wallet: ${wallet}`);
          return;
        }
        const { otherMint, tokenBalance } = res;

        const userTokens = await getTrackedTokens(wallet);
        if (userTokens === null) {
          logger.debug(`Received log for wallet, but no userTokens object found (user logged out). Wallet: ${wallet}`);
          return;
        }
        let broadcastData;

        if (tokenBalance >= 3) {
          const logoData = await tokenLogo(otherMint);
          const uiTokenBalance = tokenBalance / 10 ** (logoData?.decimals ?? 6);
          const totalTokenValue = await totalOwned(otherMint, uiTokenBalance);

          broadcastData = {
            listToken: true,
            tokenMint: otherMint,
            tokenBalance: uiTokenBalance,
            usdValue: Number(totalTokenValue) || NaN,
            logoURI: logoData?.logoURI || DEFAULT_IMG,
            symbol: logoData?.symbol || 'No ticker',
          };
          logger.info(`Updating token for wallet: ${wallet}`);
          await updateTrackedToken(wallet, otherMint, broadcastData);
        } else {
          broadcastData = { tokenMint: otherMint, removed: true };
          logger.info(`Removing token for wallet: ${wallet}`);
          await removeTrackedToken(wallet, otherMint);
        }
        await publishToUser(wallet, broadcastData);
      },
      'confirmed'
    );
  } catch (err) {
    logger.error({ err, wallet }, `Error listening to wallets`);
  }
}

export async function start(wallet: string) {
  try {
    await listenToWallets(wallet);
    logger.info(`Started listener for wallet: ${wallet}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, wallet }, `WebSocket service start error: ${message}`);
  }
}
