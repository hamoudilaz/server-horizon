import { validateBuyBody, validateSellBody } from "../validateInput.js";
import { simulateBuy, simulateSell } from "./simulate.js";
import { getDemoAmount, sessions } from "../globals.js";
import { getSolPrice } from "../../helpers/helper.js";
import { v4 as uuidv4 } from 'uuid';


export const demoBuyhandler = async (request, reply) => {
    const start = Date.now();
    try {
        const body = { ...request.body };
        const session = request.cookies.session;

        const validate = validateBuyBody(body, true);
        if (validate) {
            return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
        }

        let { mint, buyAmount } = body;
        let txid = await simulateBuy(session, mint, buyAmount);

        if (txid.error) return reply.status(400).send({ error: txid.error })

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



export const demoSellHandler = async (request, reply) => {
    try {
        const body = { ...request.body };
        const session = request.cookies.session;

        const validate = validateSellBody(body);
        if (validate) {
            return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
        }

        let { outputMint, amount } = body;
        let ownedAmount
        ownedAmount = getDemoAmount(session, outputMint);

        if (ownedAmount <= 0) {
            return reply.status(400).send({ error: 'You dont have any tokens of this mint' });

        }


        const time = Date.now();


        let txid = await simulateSell(session, outputMint, ownedAmount, amount);

        const end = Date.now() - time;


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


export const startDemo = async (request, reply) => {
    try {
        const { amount } = request.body;
        if (!amount) return reply.status(400).send({ error: "Missing amount in body" });

        const session = uuidv4();
        sessions.set(session, {
            initialAmount: amount,
            currentUsd: amount,
            tokens: new Map(),
            tokensDisplay: {}
        });


        reply.setCookie('session', session, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });

        return reply.status(200).send({ session, amount });

    } catch (error) {
        return reply.status(500).send({ error: error.message });
    }
};



export function validateDemoSession(request, reply, done) {
    const session = request.cookies.session;
    const data = sessions.get(session);
    if (!data) {
        return reply.status(401).send({ error: 'Invalid session' });
    }

    request.user = data;


    done();
}



export async function getSessionState(request, reply, done) {
    const session = request.cookies.session;
    const data = sessions.get(session);
    if (!data) {
        return reply.status(401).send({ error: 'Invalid session' });
    }


    const solPrice = await getSolPrice()
    const sol = (data.currentUsd / solPrice).toFixed(4);


    reply.status(200).send({
        valid: true,
        amount: {
            ...data,
            SOL: sol,
            SOLPRICE: solPrice.toFixed(3),
            currentUsd: data.currentUsd.toFixed(3),
        },
    });

    // broadcastToClients(data.tokensDisplay[0]);

}






export async function fetchDemoTokens(request, reply, done) {
    const session = request.cookies.session;

    const data = sessions.get(session);

    reply.status(200).send(Object.values(data?.tokensDisplay));

    // broadcastToClients(data.tokensDisplay[0]);

}
