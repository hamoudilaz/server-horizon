import { validateBuyBody, validateSellBody } from '../validateInput.js';
import { simulateBuy, simulateSell } from './simulate.js';
import { getDemoAmount, sessions } from '../globals.js';
import { getSolPrice } from '../../helpers/helper.js';
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { BuyBody, SellBody, DemoSession } from '../../types/interfaces.js';

interface TxidResult {
  error?: string;
  result?: string;
}

interface StartDemo {
  amount: number;
}

export const demoBuyhandler = async (
  request: FastifyRequest<{ Body: BuyBody }>,
  reply: FastifyReply
): Promise<TxidResult> => {
  const start = Date.now();
  try {
    const body = { ...request.body };
    const session = request.session.demo as DemoSession;
    if (!session) return reply.status(401).send({ error: 'invalid session' });

    const validate = validateBuyBody(body, true);
    if (validate) {
      return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { mint, buyAmount } = body;
    const txid = (await simulateBuy(session, mint, buyAmount)) as TxidResult;

    if (!txid || txid.error) {
      return reply.status(400).send({ error: txid?.error || 'simulation error' });
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

export const demoSellHandler = async (
  request: FastifyRequest<{ Body: SellBody }>,
  reply: FastifyReply
) => {
  try {
    const body = { ...request.body };
    const session = request.session.demo as DemoSession;
    if (!session) return reply.status(401).send({ error: 'invalid session' });

    const validate = validateSellBody(body);
    if (validate) {
      return reply.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { outputMint, amount } = body;
    let ownedAmount;

    ownedAmount = getDemoAmount(session, outputMint);

    if (ownedAmount <= 0) {
      return reply.status(400).send({ error: 'You dont have any tokens of this mint' });
    }

    const time = Date.now();

    let txid = (await simulateSell(session, outputMint, ownedAmount, amount)) as TxidResult;

    if (!txid || txid.error) {
      return reply.status(400).send({ error: txid?.error || 'simulation error' });
    }

    const end = Date.now() - time;

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

export const startDemo = async (
  request: FastifyRequest<{ Body: StartDemo }>,
  reply: FastifyReply
) => {
  try {
    const { amount } = request.body;
    if (amount > 100000)
      return reply.status(400).send({ error: ' Demo amount cannot be greater than 100000$' });
    if (!amount) return reply.status(400).send({ error: 'Missing amount in body' });

    request.session.demo = {
      initialAmount: amount,
      currentUsd: amount,
      tokens: new Map(),
      tokensDisplay: {},
    };

    return reply.status(200).send({ amount });
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
};

export function validateDemoSession(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const data = request.session.demo;
  if (!data) {
    return reply.status(401).send({ error: 'Invalid demo session. Please start a new demo.' });
  }
  request.user = {
    ...data,
    pubKey: 'demo-user',
  };

  done();
}

export async function getSessionState(request: FastifyRequest, reply: FastifyReply) {
  const data = request.session.demo;
  if (!data) {
    return reply.status(401).send({ error: 'Invalid demo session. Please start a new demo.' });
  }

  const solPrice = await getSolPrice();
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

export const resetDemo = async (request: FastifyRequest, reply: FastifyReply) => {
  // Destroy only the demo part of the session
  if (request.session.demo) {
    delete request.session.demo;
  }
  return reply.code(200).send({ message: 'Demo session reset' });
};

export async function fetchDemoTokens(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.session.demo;
    if (!data) {
      return reply.status(400).send({ error: 'Invalid demo session' });
    }
    const tokens = Object.values(data.tokensDisplay || {});

    return reply.status(200).send(tokens);
  } catch (error) {
    return reply.status(500).send({ error: 'something went wrong' });
  }
}
