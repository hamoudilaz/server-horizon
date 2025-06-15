import { validateBuyBody, validateSellBody } from "../validateInput.js";
import { simulateBuy, simulateSell } from "./simulate.js";
import { getDemoAmount, sessions } from "../globals.js";
import { getSolPrice } from "../../helpers/helper.js";
import { v4 as uuidv4 } from 'uuid';


export const demoBuyhandler = async (request, reply) => {
    const start = Date.now();
    try {
        const body = { ...request.body };
        const session = request.session.demo;

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
        const session = request.session.demo;

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
        if (amount > 100000) return reply.status(400).send({ error: " Demo amount cannot be greater than 100000$" })
        if (!amount) return reply.status(400).send({ error: "Missing amount in body" });

        request.session.demo = {
            initialAmount: amount,
            currentUsd: amount,
            tokens: new Map(),
            tokensDisplay: {}
        };

        return reply.status(200).send({ amount });

    } catch (error) {
        return reply.status(500).send({ error: error.message });
    }
};



export function validateDemoSession(request, reply, done) {
    const data = request.session.demo;
    if (!data) {
        return reply.status(401).send({ error: 'Invalid demo session. Please start a new demo.' });
    }

    request.user = data;


    done();
}



export async function getSessionState(request, reply, done) {
    const data = request.session.demo;
    if (!data) {
        return reply.status(401).send({ error: 'Invalid demo session. Please start a new demo.' });
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


}


export const resetDemo = async (request, reply) => {
    // Destroy only the demo part of the session
    if (request.session.demo) {
        request.session.demo = null; // or delete request.session.demo
    }
    return reply.code(200).send({ message: 'Demo session reset' });
}





export async function fetchDemoTokens(request, reply, done) {
    try {
        const data = request.session.demo;
        if (!data) {
            return reply.status(400).send({ error: "Invalid demo session" });
        }

        reply.status(200).send(Object.values(data?.tokensDisplay));

    } catch (error) {
        return reply.status(500).send({ error: "something went wrong" })
    }

}
