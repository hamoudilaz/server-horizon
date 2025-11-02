import { getSolPrice, tokenLogo, totalOwned } from '../../services/external/price.service.js';
import { solMint } from '../../config/constants.js';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { userTrackedTokens } from '../../config/globals.js';
import { validateKey } from '../../services/validation/validateKey.js';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { secureWalletStore } from '../../config/globals.js';
import { start } from '../../services/websocket.service.js';
dotenv.config();

export const loadWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Missing key in body' });
    }

    if (!validateKey(key)) {
      return res.status(400).json({ error: 'Invalid key format' });
    }

    const wallet = Keypair.fromSecretKey(bs58.decode(key)); //
    const pubKey = wallet.publicKey.toBase58();

    // 1. Regenerate the session. This is async and takes a callback.
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          return reject(err);
        }

        // 2. Assign data *inside* the callback to ensure it's on the new session
        req.session.user = { pubKey }; //
        resolve();
      });
    });

    // 3. The rest of your logic remains the same
    secureWalletStore.set(pubKey, wallet); //
    userTrackedTokens.set(pubKey, {}); //
    await start(pubKey); //

    return res.status(200).json({ pubKey });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error(error);
    next(error);
  }
};

export const handleAmount = async (req: Request, res: Response) => {
  try {
    let price: number;
    price = await getSolPrice();

    if (!price || price === 0) {
      return res.status(400).json({ error: 'Failed to get SOL Price' });
    }

    const pubkey = req?.session?.user?.pubKey;
    const data = await (await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${pubkey}`)).json();
    const sol = data?.SOL?.uiAmount || 0;
    const wsol = data?.[solMint]?.uiAmount || 0;
    const usdValue = ((sol + wsol) * price).toFixed(2);

    res.status(200).json({
      usdValue: Number(usdValue),
      SOL: Number(sol.toFixed(4)),
      WSOL: Number(wsol.toFixed(4)),
      SOLPRICE: price || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.status(500).json({ error: 'Internal server error', details: message });
  }
};

export const handleLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pubkey = req.session.user?.pubKey;
    if (!pubkey) {
      return res.status(400).json({ error: 'Invalid or missing session ID' });
    }
    userTrackedTokens.delete(pubkey);

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    };

    // express-session destroy() takes a callback
    req.session.destroy((err) => {
      if (err) {
        // If session destroy fails, pass error to central handler
        return next(err);
      }

      // Clear the cookie and send response
      res.clearCookie('sessionId', cookieOptions).status(200).json({ message: 'Logged out' });
    });
  } catch (err) {
    next(err);
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const pubkey = req?.session?.user?.pubKey;
    if (!pubkey) {
      return res.status(401).json({ error: 'Not authenticated' });
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

    res.status(200).json({ portfolio, solPrice: solPrice });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.status(500).json({ error: 'Internal server error', details: message });
  }
};

export const getSingleToken = async (req: Request, res: Response) => {
  try {
    const { tokenMint, tokenBalance } = req.body as {
      tokenMint: string;
      tokenBalance: number;
    };

    const pubkey = req.session.user?.pubKey;
    if (!pubkey) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const usdValueString = await totalOwned(tokenMint, tokenBalance);
    const numericUsdValue = parseFloat(usdValueString);

    res.status(200).json({
      tokenMint,
      usdValue: numericUsdValue.toFixed(5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.status(500).json({ error: 'Internal server error', details: message });
  }
};

export const fetchTokens = async (req: Request, res: Response) => {
  try {
    const pubkey = req.session.user?.pubKey;
    if (!pubkey) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const trackedTokens = userTrackedTokens.get(pubkey);

    if (!trackedTokens) {
      return res.status(200).send([]);
    }

    res.status(200).send(Object.values(trackedTokens));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.status(500).json({ error: 'Internal server error', details: message });
  }
};
