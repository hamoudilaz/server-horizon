import { solMint } from '../../config/constants.js';
import { getBalance } from '../../services/solana/panel.js';
import { swap } from '../../services/engine/execute.js';
import { Request, Response } from 'express';
import { validateBuyBody, validateSellBody } from '../../services/validation/validateInput.js';
import { ExecuteResult, validBuyBody, validSellBody } from '../../core/types/interfaces.js';
import { secureWalletStore } from '../../config/globals.js';
import { swapBloxroute } from '../../services/engine/bloxroute.js';

export const buyHandler = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const body = { ...req.body };

    const validate = validateBuyBody(body);
    if (validate) {
      return res.status(400).json({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { mint, buyAmount, slippage, fee, jitoFee, node } = body as validBuyBody;
    const pubKey = req.session.user?.pubKey;
    if (!pubKey) return res.status(401).json({ error: 'Not authenticated' });

    const wallet = secureWalletStore.get(pubKey);
    if (!wallet) return res.status(403).json({ error: 'Wallet not found in memory' });

    let execute = node ? swapBloxroute : swap;

    let txid = (await execute(solMint, mint, buyAmount, slippage, fee, jitoFee, wallet, pubKey)) as ExecuteResult;

    if (txid?.limit) {
      console.log('rate limit activated on return');
      return res.status(429).json({ limit: true, error: `${txid?.limit}` });
    }

    if (txid?.error) {
      return res.status(400).json({
        status: '400',
        error: txid.message || txid.error,
        details: txid.details,
      });
    }

    if (!txid.result) {
      return res.status(400).json({ status: '400', error: `${txid}` });
    }

    const end = Date.now() - start;

    return res.status(200).json({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    return res.status(500).json({
      status: '500',
      error: `Internal Server Error: ${message}`,
    });
  }
};

export const sellHandler = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };

    const validate = validateSellBody(body);
    if (validate) {
      return res.status(400).send({ status: '400', error: `Invalid request, ${validate}` });
    }

    let { outputMint, amount, fee, jitoFee, node, slippage } = body as validSellBody;

    const pubKey = req.session.user?.pubKey;
    if (!pubKey) return res.status(401).send({ error: 'Not authenticated' });

    const wallet = secureWalletStore.get(pubKey);
    if (!wallet) return res.status(403).send({ error: 'Wallet not found in memory' });

    let ownedAmount = await getBalance(outputMint, pubKey);

    if (typeof ownedAmount !== 'number' || isNaN(ownedAmount) || ownedAmount <= 0) {
      return res.status(400).send({ error: 'You dont have any tokens of this mint' });
    }
    const totalSellAmount = Math.floor((ownedAmount * amount) / 100);
    const time = Date.now();

    let execute = node ? swapBloxroute : swap;

    const txid: ExecuteResult = (await execute(
      outputMint,
      solMint,
      totalSellAmount,
      slippage,
      fee,
      jitoFee,
      wallet,
      pubKey
    )) as ExecuteResult;

    const end = Date.now() - time;
    if (txid.limit) {
      return res.status(429).send({ status: '429', error: `${txid}` });
    }

    if (txid?.error) {
      return res.status(400).send({ status: '400', error: txid.message || txid.error, details: txid.details });
    }

    if (!txid.result) {
      return res.status(400).send({ status: '400', error: `${txid}` });
    }

    return res.status(200).send({ message: `https://solscan.io/tx/${txid.result}`, end });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Server error:', err);
    return res.status(500).send({
      status: '500',
      error: `Internal Server Error: ${message}`,
    });
  }
};
