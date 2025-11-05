import { tokenLogo, getTotalOwnedTokens } from '../../services/external/price.service.js';
import { SOL_PRICE_KEY, solMint } from '../../config/constants.js';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { validateKey } from '../../services/validation/validateKey.js';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { start } from '../../services/websocket/websocket.service.js';
import logger from '../../config/logger.js';
import { initTrackedTokens, deleteTrackedTokens, getTrackedTokens } from '../../services/redis/trackedTokens.js';
import { encrypt } from '../../core/utils/crypto.js';
import { redisClient } from '../../config/redis.js';
dotenv.config();

const ACTIVE_WALLETS_KEY = 'active_wallets';

export const loadWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.body;

    if (!key) {
      logger.warn('loadWallet attempt with missing key');
      return res.status(400).json({ error: 'Missing key in body' });
    }

    if (!validateKey(key)) {
      logger.warn('Attempted to load wallet with invalid key format');
      return res.status(400).json({ error: 'Invalid key format' });
    }

    const wallet = Keypair.fromSecretKey(bs58.decode(key)); //
    const pubKey = wallet.publicKey.toBase58();
    const encryptedKey = encrypt(key);

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          logger.error({ err, pubKey }, 'Failed to regenerate session');
          return reject(err);
        }

        req.session.user = { pubKey, encryptedKey: encryptedKey };
        resolve();
      });
    });

    await initTrackedTokens(pubKey);

    await redisClient.sAdd(ACTIVE_WALLETS_KEY, pubKey);

    await start(pubKey); //
    logger.info({ pubKey }, 'Wallet loaded, session created, and websocket started');

    return res.status(200).json({ pubKey });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err }, `Server error during loadWallet: ${error}`);
    next(error);
  }
};

export const handleAmount = async (req: Request, res: Response) => {
  const pubkey = req?.session?.user?.pubKey;
  try {
    let price: number;
    price = Number(await redisClient.get(SOL_PRICE_KEY));

    if (!price || price === 0) {
      logger.warn({ pubkey }, 'Failed to get SOL Price in handleAmount');
      return res.status(400).json({ error: 'Failed to get SOL Price' });
    }

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
    logger.error({ err, pubkey }, 'Failed to handleAmount');
    res.status(500).json({ error: 'Internal server error', details: message });
  }
};

export const handleLogout = async (req: Request, res: Response, next: NextFunction) => {
  const pubKey = req.session.user?.pubKey;

  try {
    if (!pubKey) {
      logger.warn('Logout attempt with no session pubKey');
      return res.status(400).json({ error: 'Invalid or missing session ID' });
    }

    // 👇 --- ADD THIS LINE ---
    await redisClient.sRem(ACTIVE_WALLETS_KEY, pubKey);
    // 👆 --- THIS IS THE NEW LOGIC ---

    await deleteTrackedTokens(pubKey);

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    };

    req.session.destroy((err) => {
      if (err) {
        logger.error({ err, pubKey }, 'Session destroy failed during logout');
        return next(err);
      }
      logger.info({ pubKey }, 'User logged out and session destroyed');
      res
        .clearCookie('sessionId', cookieOptions)
        .clearCookie('connect.sid', cookieOptions)
        .status(200)
        .json({ message: 'Logged out' });
    });
  } catch (err) {
    logger.error({ err, pubKey }, 'Unhandled error during logout');
    next(err);
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  const pubkey = req?.session?.user?.pubKey;

  try {
    if (!pubkey) {
      logger.warn('getPortfolio attempt with no session pubKey');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const solPrice = Number(await redisClient.get(SOL_PRICE_KEY));

    const balances = await (await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${pubkey}`)).json();

    const portfolio = [];

    for (const mint in balances) {
      if (mint === solMint) continue;

      const balanceInfo = balances[mint];
      const tokenBalance = balanceInfo.uiAmount;

      if (tokenBalance > 10) {
        const usdValueString = await getTotalOwnedTokens(mint, tokenBalance);
        const usdValue = parseFloat(usdValueString);

        // Only include tokens with a value greater than $1
        if (usdValue > 1) {
          const logoData = await tokenLogo(mint);
          portfolio.push({
            tokenMint: mint,
            tokenBalance: tokenBalance,
            usdValue: usdValue.toFixed(4),
            logoURI: logoData?.logoURI,
            symbol: logoData?.symbol,
          });
        }
      }
    }

    logger.info(`Retrieved portfolio for wallet: ${pubkey}`);

    res.status(200).json({ portfolio, solPrice: solPrice });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, pubkey }, `Failed to getPortfolio: ${message}`);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
};

export const getSingleToken = async (req: Request, res: Response) => {
  const pubkey = req.session.user?.pubKey;

  try {
    const { tokenMint, tokenBalance } = req.body as {
      tokenMint: string;
      tokenBalance: number;
    };

    if (!pubkey) {
      logger.warn('getSingleToken attempt with no session pubKey');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const usdValueString = await getTotalOwnedTokens(tokenMint, tokenBalance);
    const usdValue = parseFloat(usdValueString);

    res.status(200).json({
      tokenMint,
      usdValue: usdValue.toFixed(5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, pubkey, body: req.body }, `Failed to getSingleToken: ${message}`);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
};

export const fetchTokens = async (req: Request, res: Response) => {
  const pubkey = req.session.user?.pubKey;

  try {
    if (!pubkey) {
      logger.debug('fetchTokens attempt with no session pubKey');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const trackedTokens = await getTrackedTokens(pubkey);

    if (trackedTokens === null) {
      logger.debug({ pubkey }, 'No tracked tokens found for user (null)');
      return res.status(200).send([]);
    }

    res.status(200).send(Object.values(trackedTokens));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, pubkey }, `Failed to fetchTokens: ${message}`);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
};
