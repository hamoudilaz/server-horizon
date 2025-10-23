import { getSolPrice, getSolPriceFallback, tokenLogo, totalOwned } from '../helpers/helper.js';
import { solMint } from '../helpers/constants.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import dotenv from 'dotenv';
import { userTrackedTokens } from '../utils/globals.js';
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
  const pubkey = request.session.user?.pubKey;
  if (!pubkey) {
    return reply.status(400).send({ error: 'Invalid or missing session ID' });
  }
  userTrackedTokens.delete(pubkey);

  await request.session.destroy();
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

export const getPortfolio = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const pubkey = request?.session?.user?.pubKey;
    if (!pubkey) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const solPrice = await getSolPrice();
    const balances = await (await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${pubkey}`)).json();

    const portfolio = [];

    for (const mint in balances) {
      // Skip the native SOL balance provided by the Jupiter API.
      // wSOL (solMint) will be handled like any other SPL token.
      if (mint === solMint) continue;

      const balanceInfo = balances[mint];
      const tokenBalance = balanceInfo.uiAmount;

      if (tokenBalance > 0) {
        const usdValueString = await totalOwned(mint, tokenBalance);
        const numericUsdValue = parseFloat(usdValueString);

        // Only include tokens with a value greater than $1
        if (numericUsdValue > 1) {
          const logoData = await tokenLogo(mint);
          portfolio.push({
            tokenMint: mint,
            tokenBalance: tokenBalance,
            usdValue: numericUsdValue.toFixed(4),
            logoURI: logoData?.logoURI,
            symbol: logoData?.symbol,
          });
        }
      }
    }

    console.log(portfolio);

    reply.status(200).send({ portfolio, solPrice: solPrice });
  } catch (err: any) {
    reply.status(500).send({ error: 'Internal server error', details: err?.message });
  }
};

export const getSingleToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { tokenMint, tokenBalance } = request.body as {
      tokenMint: string;
      tokenBalance: number;
    };

    const pubkey = request.session.user?.pubKey;
    if (!pubkey) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const usdValueString = await totalOwned(tokenMint, tokenBalance);
    const numericUsdValue = parseFloat(usdValueString);

    reply.status(200).send({
      tokenMint,
      usdValue: numericUsdValue.toFixed(5),
    });
  } catch (err: any) {
    reply.status(500).send({ error: 'Internal server error', details: err?.message });
  }
};

export const fetchTokens = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const pubkey = request.session.user?.pubKey;
    if (!pubkey) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const trackedTokens = userTrackedTokens.get(pubkey);

    if (!trackedTokens) {
      return reply.status(200).send([]);
    }

    reply.status(200).send(Object.values(trackedTokens));
  } catch (err: any) {
    reply.status(500).send({ error: 'Internal server error', details: err?.message });
  }
};
