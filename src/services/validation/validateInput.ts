import { BuyBody, SellBody } from '../../core/types/interfaces.js';

export function validateBuyBody(body: BuyBody, isDemo?: boolean): string | null {
  if (!body.mint) return 'mint is missing';
  if (typeof body.mint !== 'string' || body.mint.length > 45 || body.mint.length < 42)
    return 'Mint must be a string and between 43-44 characters';

  if (body.buyAmount == null) return 'amount is missing';
  if (!Number.isFinite(body.buyAmount)) return 'Amount must be a finite number.';

  if (isDemo) {
    if (typeof body.buyAmount !== 'number' || body.buyAmount > 1000 || body.buyAmount < 0.0000001) {
      return 'wSOL amount must be a number between 0.000001 - 10';
    }
  } else if (typeof body.buyAmount !== 'number' || body.buyAmount > 10 || body.buyAmount < 0.000001) {
    return 'wSOL amount must be a number between 0.000001 - 10';
  }

  if (body.slippage == null) body.slippage = 10;
  if (!Number.isFinite(body.slippage) || body.slippage > 100 || body.slippage < 0.01)
    return 'Slippage must be a number between 0.01 - 100';

  if (body.fee == null || body.fee === 0) body.fee = 0.000001;
  if (!Number.isFinite(body.fee)) return 'Fee must be a finite number.';
  if (body.fee > 0.2) return 'Too high fee!';
  if (typeof body.fee !== 'number' || body.fee > 0.1) return 'Fee must be a number between 0.000001 - 0.1';

  if (body.jitoFee === 0 || body.jitoFee == null) body.jitoFee = 0.000001;
  if (!Number.isFinite(body.jitoFee)) return 'Invalid PrioFee type';
  if (body.jitoFee > 0.2) return 'Too high PrioFee';

  if (typeof body.node !== 'boolean' || body.node == null) body.node = false;
  if (body.node === true && body.jitoFee < 0.001) body.jitoFee = 0.001;

  if (isDemo) {
    return null;
  }

  body.buyAmount = body.buyAmount * 1e9;
  body.jitoFee = (body.jitoFee ?? 0.000001) * 1e9;
  body.slippage = (body.slippage ?? 10) * 100;

  return null;
}

export function validateSellBody(body: SellBody) {
  if (!body.outputMint) return 'mint is missing';
  if (typeof body.outputMint !== 'string' || body.outputMint.length > 45 || body.outputMint.length < 42)
    return 'Mint must be a string and between 43-44 characters';

  if (!body.amount) return 'amount is missing';
  if (!Number.isFinite(body.amount) || body.amount < 1 || body.amount > 100)
    return 'Amount must be a number between 1 - 100';

  if (body.slippage == null) body.slippage = 10;
  if (!Number.isFinite(body.slippage) || body.slippage > 100 || body.slippage < 0.01)
    return 'Slippage must be a number between 0.01 - 100';

  if (body.fee == null || body.fee === 0) body.fee = 0.000001;
  if (!Number.isFinite(body.fee)) return 'Fee must be a finite number.';

  if (typeof body.fee !== 'number' || body.fee > 0.1) return 'Fee must be a number between 0.000001 - 0.1';
  if (body.fee > 0.2) return 'Too high fee!';

  if (body.jitoFee === 0 || body.jitoFee == null) body.jitoFee = 0.000001;
  if (!Number.isFinite(body.jitoFee)) return 'Invalid PrioFee type';
  if (body.jitoFee > 0.2) return 'Too high PrioFee';

  if (typeof body.node !== 'boolean' || body.node == null) body.node = false;

  if (body.node === true && body.jitoFee < 0.001) body.jitoFee = 0.001;

  body.slippage = body.slippage * 100;
  body.jitoFee = body.jitoFee * 1e9;

  return null;
}
