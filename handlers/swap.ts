import { solMint } from '../helpers/constants.js';
import { getBalance, loadKey } from '../panel.js';
import { swap } from '../engine/execute.js';
import { swapNoz } from '../engine/nozomi.js';
import { start } from '../helpers/websocket.js';
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { validateBuyBody, validateSellBody } from '../utils/validateInput.js';
import { getHeldAmount } from '../utils/globals.js';
import {
  BuyBody,
  ExecuteResult,
  SellBody,
  validBuyBody,
  validSellBody,
} from '../types/interfaces.js';

export const buyHandler = async (
  request: FastifyRequest<{ Body: BuyBody }>,
  reply: FastifyReply
) => {
  const start = Date.now();
  try {
    const body = { ...request.body };

    const validate = validateBuyBody(body);
    if (validate) {
      return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { mint, buyAmount, slippage, fee, jitoFee, node } = body as validBuyBody;

    let execute = node ? swapNoz : swap;

    let txid: ExecuteResult = (await execute(
      solMint,
      mint,
      buyAmount,
      slippage,
      fee,
      jitoFee
    )) as ExecuteResult;

    if (txid?.limit) {
      console.log('rate limit activated on return');
      return reply.status(429).send({ limit: true, error: `${txid?.limit}` });
    }

    if (txid?.error) {
      console.log('buyHandler TX:', txid);
      return reply
        .status(400)
        .send({ status: '400', error: txid.message || txid.error, details: txid.details });
    }

    if (!txid.result) {
      return reply.status(400).send({ status: '400', error: `${txid}` });
    }

    const end = Date.now() - start;

    return reply.status(200).send({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err: any) {
    return reply.status(500).send({
      status: '500',
      error: `Internal Server Error: ${err.message}`,
      details: err.message,
    });
  }
};

export const sellHandler = async (
  request: FastifyRequest<{ Body: SellBody }>,
  reply: FastifyReply
) => {
  try {
    const body = { ...request.body };

    const validate = validateSellBody(body);
    if (validate) {
      return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { outputMint, amount, fee, jitoFee, node, slippage } = body as validSellBody;
    let ownedAmount;
    ownedAmount = getHeldAmount(outputMint);
    if (ownedAmount <= 0) {
      ownedAmount = await getBalance(outputMint);
      if (typeof ownedAmount !== 'number' || isNaN(ownedAmount) || ownedAmount <= 0) {
        return reply.status(400).send({ error: 'You dont have any tokens of this mint' });
      }
    }

    const totalSellAmount = Math.floor((ownedAmount * amount) / 100);
    const time = Date.now();

    let execute = node ? swapNoz : swap;

    const txid: ExecuteResult = (await execute(
      outputMint,
      solMint,
      totalSellAmount,
      slippage,
      fee,
      jitoFee
    )) as ExecuteResult;

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
  } catch (err: any) {
    console.error('Server error:', err);
    return reply.status(500).send({
      status: '500',
      error: `Internal Server Error: ${err.message}`,
      details: err.message,
    });
  }
};

interface Key {
  key: string;
}

export const loadWallet = async (request: FastifyRequest<{ Body: Key }>, reply: FastifyReply) => {
  try {
    const { key } = request.body;

    if (!key) return reply.status(400).send({ error: 'Missing key in body' });

    const pubKey = loadKey(key);

    if (typeof pubKey !== 'string') {
      return reply.status(400).send({ status: '400', error: pubKey.error || 'bad key size' });
    }

    request.session.user = { pubKey };

    await start(pubKey);

    return reply.status(200).send({ pubKey });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ status: '500', error: 'Server error' });
  }
};

export function validateSession(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  if (!request.session.user) {
    reply.status(401).send({ error: 'Invalid session' });
    return;
  }
  // No need to copy anything, just call done()
  done();
}
