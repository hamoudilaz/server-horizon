import {
    VersionedTransaction, ComputeBudgetProgram,
} from '@solana/web3.js';
import { wallet, pubKey } from '../panel.js';
import { request } from 'undici';
import { fetchWithTimeout, fetchWithTimeoutSwap, agent } from "../helpers/fetchTimer.js"
import dotenv from 'dotenv';
import { solMint } from "../helpers/constants.js"


dotenv.config();

const quoteApi = process.env.JUP_QUOTE;
const swapApi = process.env.JUP_SWAP;
const JITO_RPC = process.env.JITO_RPC;

export async function swap(inputmint, outputMint, amount, SlippageBps, fee, jitoFee) {


    console.log('inputmint:', inputmint);
    console.log('outputMint:', outputMint);
    console.log('amount:', amount);
    console.log('SlippageBps:', SlippageBps);
    console.log('fee:', fee);
    console.log('jitoFee:', jitoFee);
    try {

        if (!wallet || !pubKey) throw new Error('Failed to load wallet');

        const url = `${quoteApi}?inputMint=${inputmint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SlippageBps}`;

        let quote;
        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                console.log(`📡 Requesting quote... (Attempt ${attempt})`);

                const quoteRes = await fetchWithTimeout(url, 120);
                if (quoteRes.limit) return { error: quoteRes.limit, limit: 429 }

                quote = await quoteRes.json();
                if (!quote.error) break;
                console.log(quote.error)
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


        for (let attempt = 1; attempt <= 5; attempt++) {
            try {
                const swapRes = await fetchWithTimeoutSwap(swapApi, 120, {
                    userPublicKey: pubKey,
                    prioritizationFeeLamports: { jitoTipLamports: jitoFee },
                    dynamicComputeUnitLimit: true,
                    quoteResponse: quote,
                    wrapAndUnwrapSol: false,
                });

                if (swapRes.limit) return { error: swapRes.limit }


                const swap = await swapRes.json();
                swapTransaction = swap.swapTransaction;
                if (swap.simulationError) {
                    throw new Error(swap.simulationError.error);
                }



                if (swapTransaction) break;
                console.warn(`⚠️ Swap retry ${attempt}: no swapTransaction`);
            } catch (err) {
                console.warn(`⚠️ simulationError: ${err.message}`);
                return { error: true, message: err.message || String(err), details: err };
            }
        }

        if (!swapTransaction) {

        }

        console.log('Signing...');


        let transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));

        let addPrice = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: fee
        });


        const newInstruction = {
            programIdIndex: transaction.message.staticAccountKeys.findIndex((key) => key.toBase58() === addPrice.programId.toBase58()),
            accountKeyIndexes: addPrice.keys.map((key) => transaction.message.staticAccountKeys.findIndex((acc) => acc.toBase58() === key.pubkey.toBase58())),
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

        const sendResult = await sendResponse.json();
        if (sendResult.error) {
            console.error('Error sending transaction:', sendResult.error);
            throw new Error(sendResult.error.message);
        }

        console.log(`JITO: https://solscan.io/tx/${sendResult.result}`);
        return sendResult;
    } catch (err) {
        return err;
    }
}
