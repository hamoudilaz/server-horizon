import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Connection(process.env.RPC_URL!, 'confirmed');

async function getBalance(outputMint: string, pubKey: string) {
  if (!pubKey) {
    console.error('Wallet is not loaded');
    return null;
  }
  try {
    if (!outputMint) return 0;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(pubKey), {
      mint: new PublicKey(outputMint),
    });

    if (!tokenAccounts.value?.length) return 0;
    const amountToSell = Math.floor(Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount));

    console.log('amt to sell func:', amountToSell);

    return amountToSell;
  } catch (error) {
    return { error };
  }
}

export { getBalance, connection };
