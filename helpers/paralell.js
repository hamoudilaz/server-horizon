import { agent } from "./fetchTimer.js";
import { request } from "undici";


const JITO_RPC = process.env.JITO_RPC;

export async function sendJito(tx) {

    const { body: sendResponse } = await request(JITO_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'sendTransaction',
            params: [
                tx,
                {
                    encoding: 'base64',
                    skipPreflight: true,
                },
            ],
        }),
        dispatcher: agent,
    });

    const sendResult = await sendResponse.json();

    if (sendResult?.result) {
        console.log(`JITO: https://solscan.io/tx/${sendResult?.result}`);
    }
}
