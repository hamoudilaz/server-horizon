// src/solanaUtils.ts
import { connection, redisClient } from '../config.js';
import { PublicKey } from '@solana/web3.js';
import {
  BroadcastedToken,
  BroadcastMessage,
  logger,
  solMint,
  TOKEN_KEY_PREFIX,
  WS_MESSAGES_CHANNEL,
} from '@horizon/shared';

type TokenBalance = {
  owner?: string;
  mint: string;
  uiTokenAmount: { amount: string };
};

interface Content {
  preTokenBalances?: TokenBalance[] | null;
  postTokenBalances?: TokenBalance[] | null;
  preBalances?: number[] | null;
  postBalances?: number[] | null;
  fee: number;
  logMessages?: string[] | null;
}

interface txObject {
  meta: Content | null;
}

export async function getBalance(outputMint: string, pubKey: string) {
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

export async function getTx(signature: string, pubKey: string) {
  try {
    if (!pubKey) return { error: 'Pubkey is not loaded' };
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) return { error: 'No tx' };

    const decoded = await decodeTx(tx, pubKey);
    return decoded;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: message, signature, pubKey }, 'Failed to getTx from RPC');
    return { error: message };
  }
}

async function decodeTx(transaction: txObject, owner: string) {
  if (!transaction.meta) {
    return { error: 'meta missing' };
  }

  if (
    !transaction.meta?.preTokenBalances?.length ||
    !transaction.meta?.postTokenBalances?.length ||
    !transaction.meta?.preBalances?.length ||
    !transaction.meta?.postBalances?.length
  ) {
    return { error: 'preTokenBalances or postTokenBalances missing' };
  }

  const preBalances: { [mint: string]: bigint } = {};
  const postBalances: { [mint: string]: bigint } = {};

  transaction.meta.preTokenBalances.forEach((token: TokenBalance) => {
    if (token.owner === owner) {
      const mint = token.mint;
      const amount = BigInt(token.uiTokenAmount.amount);
      preBalances[mint] = (preBalances[mint] || 0n) + amount;
    }
  });

  transaction.meta.postTokenBalances.forEach((token: TokenBalance) => {
    if (token.owner === owner) {
      const mint = token.mint;
      const amount = BigInt(token.uiTokenAmount.amount);
      postBalances[mint] = (postBalances[mint] || 0n) + amount;
    }
  });

  const allMints = new Set([...Object.keys(preBalances), ...Object.keys(postBalances)]);
  let inputMint: string | null = null;
  let outputMint: string | null = null;

  allMints.forEach((mint) => {
    const pre = preBalances[mint] || 0n;
    const post = postBalances[mint] || 0n;
    const diff = post - pre;
    if (diff < 0n) {
      inputMint = mint;
    } else if (diff > 0n) {
      outputMint = mint;
    }
  });

  const preSOL = BigInt(transaction.meta.preBalances[0]);
  const postSOL = BigInt(transaction.meta.postBalances[0]);
  const fee = BigInt(transaction.meta.fee);
  let solInput = 0n,
    solOutput = 0n;
  if (postSOL < preSOL) {
    const netSpent = preSOL - postSOL;
    if (netSpent > fee) {
      solInput = netSpent - fee;
    }
  } else if (postSOL > preSOL) {
    solOutput = postSOL - preSOL + fee;
  }
  if (!inputMint && solInput > 0n) {
    inputMint = solMint;
  }
  if (!outputMint && solOutput > 0n) {
    outputMint = solMint;
  }
  const type = inputMint === solMint ? 'buy' : 'sell';

  if (!inputMint || !outputMint) {
    return { error: 'Missing inputmint or outputmint' };
  }

  if (inputMint && outputMint) {
    if (type === 'buy') {
      const balance = await getBalance(outputMint, owner);
      if (typeof balance !== 'number') return { error: 'Invalid balance' };
      return {
        otherMint: outputMint,
        tokenBalance: balance,
      };
    } else {
      const balance = await getBalance(inputMint, owner);
      if (typeof balance !== 'number') return { error: 'Invalid balance' };
      return {
        otherMint: inputMint,
        tokenBalance: balance,
      };
    }
  } else {
    return { error: 'Missing inputmint or outputmint', valid: false };
  }
}

type TokenMap = { [mint: string]: BroadcastedToken };

export async function getTrackedTokens(pubKey: string): Promise<TokenMap | null> {
  try {
    const data = await redisClient.get(`${TOKEN_KEY_PREFIX}${pubKey}`);
    return data ? (JSON.parse(data) as TokenMap) : null;
  } catch (err) {
    logger.error({ err, pubKey }, 'Failed to getTrackedTokens from Redis');
    return null;
  }
}

export async function updateTrackedToken(pubKey: string, mint: string, tokenData: BroadcastedToken): Promise<void> {
  try {
    const tokens = (await getTrackedTokens(pubKey)) ?? {};
    tokens[mint] = tokenData;
    await redisClient.set(`${TOKEN_KEY_PREFIX}${pubKey}`, JSON.stringify(tokens));
  } catch (err) {
    logger.error({ err, pubKey, mint }, 'Failed to updateTrackedToken in Redis');
  }
}
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

export async function publishToUser(pubKey: string, data: BroadcastMessage) {
  try {
    const message = JSON.stringify({ pubKey, data });
    await redisClient.publish(WS_MESSAGES_CHANNEL, message);
  } catch (err) {
    logger.error({ err, pubKey }, 'Failed to publish WebSocket message to Redis');
  }
}

export const checkIfIsSwap = async (logs: string[], owner: string) => {
  try {
    if (!logs) {
      logger.error({ owner }, 'No logs found in transaction meta');
      return false;
    }
    const isSwap = logs.some((log) => {
      return (
        log.includes('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4') ||
        log.includes('Instruction: PreTokenSwap') ||
        log.includes('Instruction: PostTokenSwap') ||
        log.includes('Instruction: Swap2') ||
        log.includes('Instruction: Swap') ||
        log.includes('Instruction: Buy') ||
        log.includes('Instruction: Sell')
      );
    });

    return isSwap;
  } catch (error) {
    logger.error({ error, owner }, 'Error checking if transaction is a swap');
    return false;
  }
};
