import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import logger from '../../config/logger.js';

dotenv.config();

const connection = new Connection(process.env.RPC_URL!, {
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
