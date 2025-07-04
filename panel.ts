import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Connection(process.env.RPC_URL!, 'confirmed');

let wallet: Keypair | null = null;
let pubKey: string | null = null;

function loadKey(key: string): string | { error: string } {
  try {
    if (!key) throw new Error('Key is undefined or empty');

    wallet = Keypair.fromSecretKey(bs58.decode(key));
    if (!wallet) throw new Error('Failed to generate wallet');

    pubKey = wallet.publicKey.toBase58();
    console.log('Your PublicKey: ' + pubKey);

    return pubKey;
  } catch (error: any) {
    console.error('loadKey error:', error.message);
    return { error: error.message };
  }
}

async function getBalance(outputMint: string) {
  if (!wallet || !wallet.publicKey) {
    console.error('Wallet is not loaded');
    return null;
  }
  try {
    if (!outputMint) return 0;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      mint: new PublicKey(outputMint),
    });

    if (!tokenAccounts.value?.length) return 0;
    const amountToSell = Math.floor(
      Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount)
    );

    console.log('amt to sell func:', amountToSell);

    return amountToSell;
  } catch (error) {
    return { error };
  }
}

export { wallet, pubKey, getBalance, loadKey, connection };
