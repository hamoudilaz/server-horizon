import { solMint } from '../../config/constants.js';
import { getBalance } from '../../services/solana/panel.js';
import { swap } from '../../services/engine/execute.js';
import { Request, Response } from 'express';
import { validateBuyBody, validateSellBody } from '../../services/validation/validateInput.js';
import { ExecuteResult, validBuyBody, validSellBody } from '../../core/types/interfaces.js';
import { swapBloxroute } from '../../services/engine/bloxroute.js';
import logger from '../../config/logger.js';
import { decrypt } from '../../core/utils/crypto.js';

export const buyHandler = async (req: Request, res: Response) => {
  const start = Date.now();
  const pubKey = req.session.user?.pubKey;

  try {
    const body = { ...req.body };

    const validate = validateBuyBody(body);
    if (validate) {
      logger.warn({ pubKey, body, error: validate }, 'Invalid buy request body');
      return res.status(400).json({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { mint, buyAmount, slippage, fee, jitoFee, node } = body as validBuyBody;
    if (!pubKey || !req.session.user?.encryptedKey) {
      logger.warn({ path: req.originalUrl }, 'Buy handler called with no pubKey/key in session');
      return res.status(401).json({ error: 'Not authenticated or key missing' });
    }

    const walletKeyPair = decrypt(req.session.user.encryptedKey);

    if (!walletKeyPair) {
      logger.error({ pubKey }, 'Wallet could not be decoded from session');
      return res.status(403).json({ error: 'Wallet could not be decoded' });
    }

    let execute = node ? swapBloxroute : swap;

    let txid = (await execute(
      solMint,
      mint,
      buyAmount,
      slippage,
      fee,
      jitoFee,
      walletKeyPair,
      pubKey
    )) as ExecuteResult;

    if (txid?.limit) {
      logger.warn({ pubKey, mint, buyAmount }, 'Swap service returned rate limit');
      return res.status(429).json({ limit: true, error: `${txid?.limit}` });
    }

    if (txid?.error) {
      logger.warn({ pubKey, mint, error: txid.error, details: txid.details }, 'Swap execution returned an error');
      return res.status(400).json({
        status: '400',
        error: txid.message || txid.error,
        details: txid.details,
      });
    }

    if (!txid.result) {
      logger.warn({ pubKey, mint, txid }, 'Swap execution returned no result or signature');
      return res.status(400).json({ status: '400', error: `${txid}` });
    }

    const end = Date.now() - start;
    logger.info(`Buy swap successful, Total time: ${end}`);

    return res.status(200).json({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, pubKey }, `Unhandled error in buyHandler: ${message}`);
    return res.status(500).json({
      status: '500',
      error: `Internal Server Error: ${message}`,
    });
  }
};

export const sellHandler = async (req: Request, res: Response) => {
  const time = Date.now();
  const pubKey = req.session.user?.pubKey;

  try {
    const body = { ...req.body };

    const validate = validateSellBody(body);
    if (validate) {
      logger.warn({ pubKey, body, error: validate }, 'Invalid sell request body');
      return res.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { outputMint, amount, fee, jitoFee, node, slippage } = body as validSellBody;

    if (!pubKey || !req.session.user?.encryptedKey) {
      logger.warn(`Sell handler called with no pubKey/key in session. Path: ${req.originalUrl}`);
      return res.status(401).send({ error: 'Not authenticated or key missing' });
    }

    const walletKeyPair = decrypt(req.session.user.encryptedKey);

    if (!walletKeyPair) {
      logger.error({ pubKey }, 'Wallet could not be decoded from session');
      return res.status(403).send({ error: 'Wallet could not be decoded' });
    }

    let ownedAmount = await getBalance(outputMint, pubKey);

    if (typeof ownedAmount !== 'number' || isNaN(ownedAmount) || ownedAmount <= 0) {
      logger.warn({ pubKey, outputMint, ownedAmount }, 'Sell attempt with no tokens');
      return res.status(400).send({ error: 'You dont have any tokens of this mint' });
    }
    const totalSellAmount = Math.floor((ownedAmount * amount) / 100);

    let execute = node ? swapBloxroute : swap;

    const txid = (await execute(
      outputMint,
      solMint,
      totalSellAmount,
      slippage,
      fee,
      jitoFee,
      walletKeyPair,
      pubKey
    )) as ExecuteResult;

    const end = Date.now() - time;
    if (txid.limit) {
      logger.warn({ pubKey, outputMint, amount }, 'Swap service returned rate limit on sell');
      return res.status(429).send({ status: '429', error: `${txid}` });
    }

    if (txid?.error) {
      logger.warn(
        { pubKey, outputMint, error: txid.message || txid.error, details: txid.details },
        'Sell execution returned an error'
      );
      return res.status(400).send({ status: '400', error: txid.message || txid.error, details: txid.details });
    }

    if (!txid.result) {
      logger.warn({ pubKey, outputMint, txid }, 'Sell execution returned no result or signature');
      return res.status(400).send({ status: '400', error: `${txid}` });
    }

    logger.info(`Sell swap successful, Total time: ${end}`);

    return res.status(200).send({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, pubKey }, `Unhandled error in sellHandler: ${message}`);
    return res.status(500).send({
      status: '500',
      error: `Internal Server Error: ${message}`,
    });
  }
};
