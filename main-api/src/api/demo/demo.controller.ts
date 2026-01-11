import { validateBuyBody, validateSellBody } from '../../services/validation/validateInput.js';
import { getDemoAmount } from './globals.js';
import { simulateBuy, simulateSell } from './simulate.js';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@horizon/shared';
import { getSolPriceFromRedis } from '../../services/redis/trackedTokens.js';

// BUY handler
export const demoBuyhandler = async (req: Request, res: Response) => {
  const start = Date.now();
  const session = req.session.demo;
  try {
    const body = { ...req.body };
    if (!session) {
      logger.warn('demoBuyhandler called with invalid session');
      return res.status(401).json({ error: 'invalid session' });
    }

    const validate = validateBuyBody(body, true);
    if (validate) {
      logger.warn({ session, body, error: validate }, 'Invalid demo buy request');
      return res.status(400).json({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { mint, buyAmount } = body;
    const txid = await simulateBuy(session, mint, buyAmount);

    if (!txid || txid.error) {
      logger.warn({ error: txid?.error }, 'Demo buy simulation failed');
      return res.status(400).json({ error: txid?.error || 'simulation error' });
    }

    const end = Date.now() - start;
    logger.info({ mint, buyAmount, tx: txid.result, duration: end }, 'Demo buy successful');

    return res.status(200).json({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    logger.error({ err, session }, `Internal Server Error in demoBuyhandler`);
    return res.status(500).json({
      status: '500',
      error: `Internal Server Error: ${(err as Error).message}`,
      details: (err as Error).message,
    });
  }
};

// SELL handler
export const demoSellHandler = async (req: Request, res: Response) => {
  const time = Date.now();
  const session = req.session.demo;
  try {
    const body = { ...req.body };
    if (!session) {
      logger.warn('demoSellHandler called with invalid session');
      return res.status(401).json({ error: 'invalid session' });
    }

    const validate = validateSellBody(body);
    if (validate) {
      logger.warn({ session, body, error: validate }, 'Invalid demo sell request');
      return res.status(400).json({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { outputMint, amount } = body;
    let ownedAmount;

    ownedAmount = getDemoAmount(session, outputMint);
    logger.info(`ownedAmount: ${ownedAmount}`);

    if (ownedAmount <= 0) {
      logger.debug({ session, outputMint }, 'Demo sell attempt with no tokens');
      return res.status(400).json({ error: 'You dont have any tokens of this mint' });
    }

    let txid = await simulateSell(session, outputMint, ownedAmount, amount);

    if (!txid || txid.error) {
      logger.warn({ error: txid?.error }, 'Demo sell simulation failed');
      return res.status(400).json({ error: txid?.error || 'simulation error' });
    }
    const end = Date.now() - time;
    logger.info(`Demo sell successful, Time taken: ${end}`);

    return res.status(200).json({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    logger.error(`Server error in demoSellHandler`);
    return res.status(500).json({
      status: '500',
      error: `Internal Server Error: ${(err as Error).message}`,
      details: (err as Error).message,
    });
  }
};

// Intializer
export const startDemo = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (amount > 100000) {
      logger.warn(`Demo start amount too high: ${amount}`);
      return res.status(400).json({ error: ' Demo amount cannot be greater than 100000$' });
    }
    if (!amount) {
      logger.warn('Demo start with no amount');
      return res.status(400).json({ error: 'Missing amount in body' });
    }

    req.session.demo = {
      initialAmount: amount,
      currentUsd: amount,
      tokens: {},
      tokensDisplay: {},
    };

    logger.info(`Demo session started with amount: ${amount}`);
    return res.status(200).json({ amount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, `Failed to start demo session: ${msg}`);
    return res.status(500).json({ error: msg });
  }
};

export async function getSessionState(req: Request, res: Response) {
  try {
    const data = req.session.demo;
    if (!data) {
      logger.warn('getSessionState called with invalid demo session');
      return res.status(401).json({ error: 'Invalid demo session. Please start a new demo.' });
    }

    const solPrice = await getSolPriceFromRedis();
    if (!solPrice) {
      logger.warn('SOL price not found in Redis during getSessionState');
      return res.status(503).json({ error: 'SOL price unavailable. Please try again shortly.' });
    }

    let sol = Number((data.currentUsd / solPrice).toFixed(4));

    if (sol > 1) {
      sol = Number(sol.toFixed(1));
    }
    if (data.currentUsd > 100) {
      data.currentUsd = Number(data.currentUsd.toFixed(0));
    }
    res.status(200).json({
      valid: true,
      amount: {
        ...data,
        SOL: sol,
        SOLPRICE: solPrice.toFixed(0),
        currentUsd: data.currentUsd,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to getSessionState');
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Resetter
export const resetDemo = async (req: Request, res: Response, next: NextFunction) => {
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  };

  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, 'Failed to destroy session during demo reset');
      return next(err);
    }

    logger.info('Demo session reset and user logged out');
    res
      .clearCookie('sessionId', cookieOptions)
      .clearCookie('connect.sid', cookieOptions)
      .status(200)
      .json({ message: 'Demo session reset and user logged out' });
  });
};

export async function fetchDemoTokens(req: Request, res: Response) {
  try {
    const data = req.session.demo;
    if (!data) {
      logger.debug('fetchDemoTokens called with invalid demo session');
      return res.status(400).json({ error: 'Invalid demo session' });
    }
    const tokens = Object.values(data.tokensDisplay || {});

    return res.status(200).json(tokens);
  } catch {
    logger.error('Failed to fetchDemoTokens');
    return res.status(500).json({ error: 'something went wrong' });
  }
}
