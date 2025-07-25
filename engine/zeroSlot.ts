import { VersionedTransaction, ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import { wallet, pubKey } from '../panel.js';
import { request } from 'undici';
import dotenv from 'dotenv';
import { fetchWithTimeout, fetchWithTimeoutSwap, agent } from '../helpers/fetchTimer.js';
import { zeroSlotTipWallets, jitoTipWallets, solMint, calculateFee } from '../helpers/constants.js';
import { sendTxResult, QuoteResponse, SwapResponse } from '../types/interfaces.js';

dotenv.config();

const randomWallet = zeroSlotTipWallets[Math.floor(Math.random() * zeroSlotTipWallets.length)];
const nozomiPubkey = new PublicKey(randomWallet);

// API's
const ZERO_SLOT_URL = process.env.ZERO_SLOT_URL;
const quoteApi = process.env.JUP_QUOTE;
const swapApi = process.env.JUP_SWAP;

export async function swapZero(
  inputmint: string,
  outputMint: string,
  amount: number,
  SlippageBps: number,
  fee: number,
  jitoFee: number
) {
  try {
    if (!wallet || !pubKey) throw new Error('Failed to load wallet');

    if (!swapApi || !ZERO_SLOT_URL || !quoteApi) {
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
      } catch (err) {
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
      } catch (err) {
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
        transaction.message.staticAccountKeys.findIndex(
          (acc) => acc.toBase58() === key.pubkey.toBase58()
        )
      ),
      data: new Uint8Array(addPrice.data),
    };

    transaction.message.compiledInstructions.splice(1, 0, newInstruction);

    const tipIndex = transaction.message.staticAccountKeys.findIndex((key) =>
      jitoTipWallets.includes(key.toBase58())
    );

    transaction.message.staticAccountKeys[tipIndex] = nozomiPubkey;

    transaction.sign([wallet]);

    const transactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

    const { body: sendResponse } = await request(ZERO_SLOT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: [transactionBase64, { encoding: 'base64', skipPreflight: true }],
      }),
      dispatcher: agent,
    });

    const sendResult: sendTxResult = (await sendResponse.json()) as sendTxResult;

    if (sendResult.error) {
      console.error('Error sending transaction:', sendResult.error);
      return { error: sendResult.error.message };
    }

    console.log(`ZeroSlot: https://solscan.io/tx/${sendResult.result}`);
    return sendResult;
  } catch (err) {
    return err;
  }
}
