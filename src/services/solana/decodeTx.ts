import { connection, getBalance } from './panel.js';
import { solMint } from '../../config/constants.js';
import { decodedTx, txObject } from '../../core/types/interfaces.js';

type TxResult = decodedTx | { error: string };

export default async function getTx(signature: string, pubKey: string): Promise<TxResult> {
  if (!pubKey) return { error: 'Pubkey is not loaded' };
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) return { error: 'No tx' };

  const decoded = await decodeTx(tx, pubKey);
  return decoded;
}

// decode logic
async function decodeTx(transaction: txObject, owner: string): Promise<TxResult> {
  if (!transaction.meta) {
    return { error: 'meta missing' };
  }

  if (
    !transaction.meta?.preTokenBalances?.length ||
    !transaction.meta?.preBalances?.length ||
    !transaction.meta?.postBalances?.length ||
    !transaction.meta?.postTokenBalances?.length
  ) {
    return { error: 'preTokenBalances missing' };
  }

  const preBalances: { [mint: string]: bigint } = {};
  const postBalances: { [mint: string]: bigint } = {};
  transaction.meta.preTokenBalances.forEach((token) => {
    if (token.owner === owner) {
      const mint = token.mint;
      const amount = BigInt(token.uiTokenAmount.amount);
      preBalances[mint] = (preBalances[mint] || 0n) + amount;
    }
  });
  transaction.meta.postTokenBalances.forEach((token) => {
    if (token.owner === owner) {
      const mint = token.mint;
      const amount = BigInt(token.uiTokenAmount.amount);
      postBalances[mint] = (postBalances[mint] || 0n) + amount;
    }
  });

  const allMints = new Set([...Object.keys(preBalances), ...Object.keys(postBalances)]);
  let inputMint = null,
    outputMint = null;

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
