import { getSolPrice, getSolPriceFallback } from '../helpers/helper.js';
import { solMint } from '../helpers/constants.js';
import { tokens, refreshTokenPrices } from '../helpers/websocket.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

export const handleAmount = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    let price: number | any;
    price = await getSolPrice();
    if (!price || price.error) {
      price = await getSolPriceFallback();
    }
    const pubkey = req?.session?.user?.pubKey;
    const data = await (await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${pubkey}`)).json();
    const sol = data?.SOL?.uiAmount || 0;
    const wsol = data?.[solMint]?.uiAmount || 0;
    const usdValue = ((sol + wsol) * price).toFixed(2);

    reply.status(200).send({
      usdValue: Number(usdValue),
      SOL: Number(sol.toFixed(4)),
      WSOL: Number(wsol.toFixed(4)),
      SOLPRICE: price || 0,
    });
  } catch (err: any) {
    reply.status(500).send({ error: 'Internal server error', details: err?.message });
  }
};

export const handleLogout = async (request: FastifyRequest, reply: FastifyReply) => {
  const sessionId = request.cookies.session;
  if (!sessionId) return reply.status(400).send({ error: 'Invalid or missing session ID' });

  reply
    .clearCookie('sessionId', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    })
    .code(200)
    .send({ message: 'Logged out' });
};

export const refreshBalance = async (request: FastifyRequest, reply: FastifyReply) => {
  const tokens = await refreshTokenPrices();
  if (!tokens) return reply.send({ error: 'No tokens available' });
  return reply.send({ tokens });
};

export const fetchTokens = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.send(Object.values(tokens));
};
