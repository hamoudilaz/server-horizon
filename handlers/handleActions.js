import { getSolPrice, getSolPriceFallback } from '../helpers/helper.js';
import { solMint } from '../helpers/constants.js';
import { tokens, refreshTokenPrices } from '../helpers/websocket.js';
import { sessions } from './swap.js';

export const handleAmount = async (req, reply) => {
    let price
    price = await getSolPrice()
    if (!price || price.error) {
        price = await getSolPriceFallback()

    }

    const data = await (await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${req.user.pubKey}`)).json();
    const sol = data?.SOL?.uiAmount || 0;
    const wsol = data?.[solMint]?.uiAmount || 0;
    const usdValue = ((sol + wsol) * price).toFixed(2);

    reply.status(200).send({
        usdValue: Number(usdValue),
        SOL: Number(sol.toFixed(4)),
        WSOL: Number(wsol.toFixed(4)),
        SOLPRICE: price || 0,
    });
}

export const handleLogout = async (request, reply) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return reply.status(400).send({ error: "Invalid or missing session ID" })

    sessions.delete(sessionId);

    reply
        .clearCookie('session', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
        })
        .code(200)
        .send({ message: 'Logged out' });
}

export const refreshBalance = async (request, reply) => {
    const tokens = await refreshTokenPrices();
    if (!tokens) return reply.send({ error: "No tokens available" })
    return reply.send({ tokens });
}

export const fetchTokens = async (request, reply) => {
    reply.send(Object.values(tokens));
}