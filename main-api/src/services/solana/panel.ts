import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import { logger, NODE_ENV } from '@horizon/shared';

dotenv.config();

// Don't create real connection during tests
const connection =
  NODE_ENV === 'test'
    ? ({} as Connection) // Mock placeholder for tests
    : new Connection(process.env.RPC_URL!, {
        wsEndpoint: process.env.WSS_URL,
        commitment: 'confirmed',
      });

async function getBalance(outputMint: string, pubKey: string) {
  if (!pubKey) {
    logger.error(`Wallet is not loaded`);
    return null;
  }

  try {
    if (!outputMint) return 0;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(pubKey), {
      mint: new PublicKey(outputMint),
    });

    if (!tokenAccounts.value?.length) return 0;
    const amountToSell = Math.floor(Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount));

    logger.debug({ pubKey, outputMint, amountToSell }, `Amount to sell`);
    return amountToSell;
  } catch (error) {
    logger.error({ error, pubKey, outputMint }, 'Failed to getBalance from RPC');
    return { error };
  }
}

export { getBalance, connection };
