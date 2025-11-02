import { validateBuyBody, validateSellBody } from '../../services/validation/validateInput.js';
import { getDemoAmount } from '../../config/globals.js';
import { simulateBuy, simulateSell } from '../../services/simulate.js';
import { Request, Response, NextFunction } from 'express';
import { DemoSession } from '../../core/types/interfaces.js';
import { getSolPrice } from '../../services/external/price.service.js';

type TxidResult = {
  error: string;
  result: string;
};

export const demoBuyhandler = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const body = { ...req.body };
    const session = req.session.demo as DemoSession;
    if (!session) return res.status(401).json({ error: 'invalid session' });

    const validate = validateBuyBody(body, true);
    if (validate) {
      return res.status(400).json({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { mint, buyAmount } = body;
    const txid = (await simulateBuy(session, mint, buyAmount)) as TxidResult;

    if (!txid || txid.error) {
      return res.status(400).json({ error: txid?.error || 'simulation error' });
    }

    const end = Date.now() - start;

    return res.status(200).json({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    return res.status(500).json({
      status: '500',
      error: `Internal Server Error: ${(err as Error).message}`,
      details: (err as Error).message,
    });
  }
};

export const demoSellHandler = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };
    const session = req.session.demo as DemoSession;
    if (!session) return res.status(401).json({ error: 'invalid session' });

    const validate = validateSellBody(body);
    if (validate) {
      return res.status(400).json({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { outputMint, amount } = body;
    let ownedAmount;

    ownedAmount = getDemoAmount(session, outputMint);
    console.log('ownedamount:', ownedAmount);

    if (ownedAmount <= 0) {
      return res.status(400).json({ error: 'You dont have any tokens of this mint' });
    }

    const time = Date.now();

    let txid = (await simulateSell(session, outputMint, ownedAmount, amount)) as TxidResult;

    if (!txid || txid.error) {
      return res.status(400).json({ error: txid?.error || 'simulation error' });
    }

    const end = Date.now() - time;

    return res.status(200).json({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      status: '500',
      error: `Internal Server Error: ${(err as Error).message}`,
      details: (err as Error).message,
    });
  }
};

export const startDemo = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (amount > 100000) return res.status(400).json({ error: ' Demo amount cannot be greater than 100000$' });
    if (!amount) return res.status(400).json({ error: 'Missing amount in body' });

    req.session.demo = {
      initialAmount: amount,
      currentUsd: amount,
      tokens: {},
      tokensDisplay: {},
    };

    return res.status(200).json({ amount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
};

export async function getSessionState(req: Request, res: Response) {
  const data = req.session.demo;
  if (!data) {
    return res.status(401).json({ error: 'Invalid demo session. Please start a new demo.' });
  }

  const solPrice = await getSolPrice();
  let sol = Number((data.currentUsd / solPrice).toFixed(4));

  if (sol > 1) {
    sol = Number(sol.toFixed(1));
  }
  if (data.currentUsd > 100) {
    data.currentUsd = Number(data.currentUsd.toFixed(0));
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
  res.status(200).json({
    valid: true,
    amount: {
      ...data,
      SOL: sol,
      SOLPRICE: solPrice.toFixed(0),
      currentUsd: data.currentUsd,
    },
  });
}

export const resetDemo = async (req: Request, res: Response, next: NextFunction) => {
  // Destroy only the demo part of the session

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  };

  req.session.destroy((err) => {
    if (err) {
      // If session destroy fails, pass error to central handler
      return next(err);
    }

    // Clear the cookie and send response
    res.clearCookie('sessionId', cookieOptions).status(200).json({ message: 'Demo session reset and user logged out' });
  });
};

export async function fetchDemoTokens(req: Request, res: Response) {
  try {
    const data = req.session.demo;
    if (!data) {
      return res.status(400).json({ error: 'Invalid demo session' });
    }
    const tokens = Object.values(data.tokensDisplay || {});

    return res.status(200).json(tokens);
  } catch {
    return res.status(500).json({ error: 'something went wrong' });
  }
}
