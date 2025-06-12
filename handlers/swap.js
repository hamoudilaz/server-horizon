import { solMint } from '../helpers/constants.js';
import { getBalance, loadKey } from '../panel.js';
import { swap } from '../engine/execute.js';
import { swapNoz } from '../engine/nozomi.js';
import { start } from '../helpers/websocket.js';
import { v4 as uuidv4 } from 'uuid';
import { validateBuyBody, validateSellBody } from '../utils/validateInput.js';
import { getHeldAmount } from '../utils/globals.js';
export const sessions = new Map();

export const buyHandler = async (request, reply) => {
    const start = Date.now();
    try {
        const body = { ...request.body };

        const validate = validateBuyBody(body);
        if (validate) {
            return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
        }

        let { mint, buyAmount, slippage, fee, jitoFee, node } = body;

        let execute = node ? swapNoz : swap;

        let txid = await execute(solMint, mint, buyAmount, slippage, fee, jitoFee);

        if (txid?.limit) {
            console.log('rate limit activated on return');
            return reply.status(429).send({ limit: true, error: `${txid?.limit}` });
        }

        if (txid?.error) {
            console.log(txid);
            return reply
                .status(400)
                .send({ status: '400', error: txid.message || txid.error, details: txid.details });
        }

        if (!txid.result) {
            return reply.status(400).send({ status: '400', error: `${txid}` });
        }

        const end = Date.now() - start;

        return reply.status(200).send({ message: `https://solscan.io/tx/${txid.result}`, end });
    } catch (err) {
        return reply
            .status(500)
            .send({
                status: '500',
                error: `Internal Server Error: ${err.message}`,
                details: err.message,
            });
    }
};

export const sellHandler = async (request, reply) => {
    try {
        const body = { ...request.body };

        const validate = validateSellBody(body);
        if (validate) {
            return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
        }

        let { outputMint, amount, fee, jitoFee, node, slippage } = body;
        let ownedAmount
        ownedAmount = getHeldAmount(outputMint);
        if (ownedAmount <= 0) {
            ownedAmount = await getBalance(outputMint);
            if (!ownedAmount || ownedAmount.error || isNaN(ownedAmount) || ownedAmount <= 0) {
                return reply.status(400).send({ error: 'You dont have any tokens of this mint' });
            }
        }


        const totalSellAmount = Math.floor((ownedAmount * amount) / 100);
        const time = Date.now();

        let execute = node ? swapNoz : swap;

        const txid = await execute(outputMint, solMint, totalSellAmount, slippage, fee, jitoFee);

        const end = Date.now() - time;
        if (txid.limit) {
            return reply.status(429).send({ status: '429', error: `${txid}` });
        }

        if (txid?.error) {
            return reply
                .status(400)
                .send({ status: '400', error: txid.message || txid.error, details: txid.details });
        }

        if (!txid.result) {
            return reply.status(400).send({ status: '400', error: `${txid}` });
        }

        return reply.status(200).send({ message: `https://solscan.io/tx/${txid.result}`, end });
    } catch (err) {
        console.error('Server error:', err);
        return reply
            .status(500)
            .send({
                status: '500',
                error: `Internal Server Error: ${err.message}`,
                details: err.message,
            });
    }
};

export const loadWallet = async (request, reply) => {
    try {
        const { key } = request.body;

        if (!key) return reply.status(400).send({ error: "Missing key in body" })

        const pubKey = loadKey(key);
        if (!pubKey || pubKey.error) {
            return reply.status(400).send({ status: '400', error: pubKey.error || "bad key size" });
        }

        const session = uuidv4();
        sessions.set(session, { pubKey });

        reply.setCookie('session', session, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            path: '/',
        });


        await start(pubKey);

        return reply.status(200).send({ pubKey });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ status: '500', error: 'Server error' });
    }
};

export function validateSession(request, reply, done) {
    const session = request.cookies.session;
    const data = sessions.get(session);

    if (!data) {
        reply.status(401).send({ error: 'Invalid session' });
        return;
    }

    request.user = data;
    done();
}
