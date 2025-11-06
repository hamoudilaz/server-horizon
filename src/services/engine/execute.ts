import { VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { request } from 'undici';
import { fetchWithTimeout, fetchWithTimeoutSwap, agent } from '../external/fetchTimer.js';
import dotenv from 'dotenv';
import { sendTxResult, QuoteResponse, SwapResponse } from '../../core/types/interfaces.js';
import { Keypair } from '@solana/web3.js';
import { ExecuteResult } from '../../core/types/interfaces.js';
import logger from '../../config/logger.js';
import { calculateFee } from '../../core/utils/calculateFee.js';

dotenv.config();

const quoteApi = process.env.JUP_QUOTE;
const swapApi = process.env.JUP_SWAP;
const JITO_RPC = process.env.JITO_RPC;

export async function swap(
  inputmint: string,
  outputMint: string,
  amount: number,
  SlippageBps: number,
  fee: number,
  jitoFee: number,
  wallet: Keypair,
  pubKey: string
): Promise<ExecuteResult> {
  const logContext = { pubKey, inputmint, outputMint, amount, service: 'bloxroute' };

  try {
    if (!wallet || !pubKey) {
      logger.error({ pubKey }, 'Failed to load wallet for swapBloxroute');
      throw new Error('Failed to load wallet');
    }

    if (!swapApi || !JITO_RPC || !quoteApi) {
      logger.error('Configuration error: Missing JITO or Jupiter API URL');
      return { error: 'Configuration error: Missing Swap API URL' };
    }

    const url = `${quoteApi}?inputMint=${inputmint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SlippageBps}`;

    let quote: QuoteResponse = {};
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const quoteRes = await fetchWithTimeout(url, 120);
        if (quoteRes && 'limit' in quoteRes) {
          logger.warn({ attempt }, `Quote retry: rate limit active.`);
          quote = { error: quoteRes.limit };
          continue;
        }

        quote = (await quoteRes.json()) as QuoteResponse;

        if (!quote.error) break;
        logger.warn({ error: quote.error }, 'Error in quote response');
      } catch {
        logger.warn({ attempt }, `Quote retry: timeout or fetch error`);
      }
    }
    if (quote.error) {
      logger.error({ ...logContext, error: quote.error }, 'Error getting quote for swap after all retries');
      return { error: quote.error };
    }

    logger.info(`Requesting swap transaction...`);

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
          logger.warn({ attempt }, `Swap retry: Rate limit active.`);
          continue; // Skip to the next attempt
        }

        const swap = (await swapRes.json()) as SwapResponse;

        if (swap.simulationError) {
          logger.warn({ simulationError: swap.simulationError }, 'Swap retry: simulation error in response');
          return { error: `Simulation error during swap: ${swap.simulationError.error}` };
        }

        swapTransaction = swap.swapTransaction;
        unitLimit = swap.computeUnitLimit;

        if (swapTransaction && unitLimit) break;

        logger.warn(`Swap retry: no swapTransaction. Attempt: ${attempt}`);
      } catch {
        logger.warn(`Swap retry: timeout or fetch error`);
      }
    }

    if (!swapTransaction || !unitLimit) {
      logger.error('Failed to retrieve swap transaction after all retries');
      return { error: 'Retry getting swap transaction' };
    }

    logger.info('Retrieved swap transaction, Signing transaction...');

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

    transaction.sign([wallet]);

    const transactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

    const { body: sendResponse } = await request(JITO_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'sendTransaction',
        params: [
          transactionBase64,
          {
            encoding: 'base64',
            skipPreflight: true,
          },
        ],
      }),
      dispatcher: agent,
    });

    const sendResult = (await sendResponse.json()) as sendTxResult;

    if (sendResult.error) {
      logger.error({ error: sendResult.error }, `Error sending transaction to Jito`);
      return sendResult as unknown as ExecuteResult;
    }
    logger.info(`Successfull swap in JITO: https://solscan.io/tx/${sendResult.result}`);

    return sendResult as unknown as ExecuteResult;
  } catch (err) {
    logger.error({ ...logContext, err }, 'Unhandled exception in swap');
    return { error: 'Unknown error' };
  }
}
