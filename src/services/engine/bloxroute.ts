import { VersionedTransaction, ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import { request } from 'undici';
import dotenv from 'dotenv';
import { fetchWithTimeout, fetchWithTimeoutSwap, agent } from '../external/fetchTimer.js';
import { jitoTipWallets, calculateFee, bloxrouteTipWallets } from '../../config/constants.js';
import { sendTxResult, QuoteResponse, SwapResponse } from '../../core/types/interfaces.js';
import { Keypair } from '@solana/web3.js';

dotenv.config();

const randomWallet = bloxrouteTipWallets[Math.floor(Math.random() * bloxrouteTipWallets.length)];
const bloxroutePubKey = new PublicKey(randomWallet);

// API's
const BLOXROUTE_URL = process.env.BLOXROUTE_URL;
const AUTH_HEADER = process.env.BLOXROUTE_AUTH;
const quoteApi = process.env.JUP_QUOTE;
const swapApi = process.env.JUP_SWAP;

export async function swapBloxroute(
  inputmint: string,
  outputMint: string,
  amount: number,
  SlippageBps: number,
  fee: number,
  jitoFee: number,
  wallet: Keypair,
  pubKey: string
) {
  try {
    if (!wallet || !pubKey) throw new Error('Failed to load wallet');

    if (!swapApi || !BLOXROUTE_URL || !quoteApi) {
      return { error: 'Configuration error: Missing Swap API URL' };
    }

    const url = `${quoteApi}?inputMint=${inputmint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SlippageBps}`;

    let quote: QuoteResponse = {};
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const quoteRes = await fetchWithTimeout(url, 120);
        if (quoteRes && 'limit' in quoteRes) {
          console.warn(`⚠️ Quote retry ${attempt}: rate limit active.`);
          quote = { error: quoteRes.limit };
          continue;
        }

        quote = (await quoteRes.json()) as QuoteResponse;

        if (!quote.error) break;
        console.log(quote.error);
      } catch {
        console.warn(`⚠️ Quote retry ${attempt}: timeout or fetch error`);
      }
    }

    if (quote.error) {
      console.error('Error getting quote:', quote.error);
      return quote.error;
    }

    console.log('Requesting swap transaction...');

    let swapTransaction;
    let unitLimit;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const swapRes = await fetchWithTimeoutSwap(swapApi, 120, {
          userPublicKey: pubKey,
          prioritizationFeeLamports: { jitoTipLamports: jitoFee },
          dynamicComputeUnitLimit: true,
          quoteResponse: quote,
          wrapAndUnwrapSol: false,
        });

        if (swapRes && 'limit' in swapRes) {
          console.warn(`⚠️ Swap retry ${attempt}: Rate limit active.`);
          continue; // Skip to the next attempt
        }

        const swap = (await swapRes.json()) as SwapResponse;
        swapTransaction = swap.swapTransaction;
        unitLimit = swap.computeUnitLimit;

        if (swapTransaction && unitLimit) break;

        console.warn(`⚠️ Swap retry ${attempt}: no swapTransaction`);
      } catch {
        console.warn(`⚠️ Swap retry ${attempt}: timeout or fetch error`);
      }
    }

    if (!swapTransaction || !unitLimit) {
      return { error: 'Retry getting swap transaction' };
    }

    console.log('Signing...');

    let baseFee = calculateFee(fee, unitLimit);

    let transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));

    let addPrice = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: baseFee,
    });

    const newInstruction = {
      programIdIndex: transaction.message.staticAccountKeys.findIndex(
        (key) => key.toBase58() === addPrice.programId.toBase58()
      ),
      accountKeyIndexes: addPrice.keys.map((key) =>
        transaction.message.staticAccountKeys.findIndex((acc) => acc.toBase58() === key.pubkey.toBase58())
      ),
      data: new Uint8Array(addPrice.data),
    };

    transaction.message.compiledInstructions.splice(1, 0, newInstruction);

    const tipIndex = transaction.message.staticAccountKeys.findIndex((key) => jitoTipWallets.includes(key.toBase58()));

    transaction.message.staticAccountKeys[tipIndex] = bloxroutePubKey;

    transaction.sign([wallet]);

    const transactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

    const { body: sendResponse } = await request(BLOXROUTE_URL, {
      method: 'POST',
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: { content: transactionBase64 },
        frontRunningProtection: true,
      }),
      dispatcher: agent,
    });

    const sendResult: sendTxResult = (await sendResponse.json()) as sendTxResult;
    if (sendResult.error) {
      console.error('Error sending transaction:', sendResult.error);
      return { error: sendResult.error.message };
    }

    if (!sendResult.signature) {
      console.error('Error sending transaction:', sendResult);
      return { error: 'signature missing from bloxroute' };
    }
    console.log(`BLOXROUTE: https://solscan.io/tx/${sendResult.signature}`);
    return { result: sendResult.signature };
  } catch (err) {
    return err;
  }
}
