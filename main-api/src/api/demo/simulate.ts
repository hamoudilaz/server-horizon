import { setDemoAmount, getDemoAmount } from './globals.js';
import { DemoSessionTypes } from './demo.types.js';
import {
  SimulatedToken,
  BroadcastMessage,
  logger,
  tokenLogo,
  getTokenPriceFallback,
  DEFAULT_IMG,
} from '@horizon/shared';
import { redisClient } from '../../config/redis.js';
import { getSolPriceFromRedis } from '../../services/redis/trackedTokens.js';

export async function simulateBuy(
  session: DemoSessionTypes,
  outputMint: string,
  solToSpend: number
): Promise<{ result?: string; error?: string } | void> {
  try {
    const data = session;
    if (!data) {
      logger.warn('SimulateBuy called with invalid session');
      throw new Error('Invalid session');
    }
    if (!data.tokensDisplay) data.tokensDisplay = {};

    const solPrice = await getSolPriceFromRedis();

    if (!solPrice) {
      logger.warn('SOL price not found in Redis during simulateBuy');
      return { error: 'SOL price unavailable. Please try again shortly.' };
    }

    const costInUsd = solToSpend * solPrice;

    if (data.currentUsd < costInUsd) {
      return {
        error: `Insufficient demo USD balance. You need $${costInUsd.toFixed(
          2
        )} but only have $${data.currentUsd.toFixed(2)}`,
      };
    }
    const logoData = await tokenLogo(outputMint);

    let tokenPrice = await getTokenPriceFallback(outputMint);
    logger.debug({ outputMint, tokenPrice }, `Fetched token price for demo buy`);

    if (tokenPrice === null || tokenPrice === undefined || tokenPrice === 0) {
      logger.warn({ outputMint }, 'Failed to fetch token price for demo buy');
      return { error: 'Failed to fetch token price' };
    }

    let newTokenAmount = costInUsd / tokenPrice;

    data.currentUsd -= costInUsd;

    setDemoAmount(session, outputMint, newTokenAmount);

    let totalTokenAmount = getDemoAmount(session, outputMint);

    if (totalTokenAmount > 100) {
      totalTokenAmount = Number(totalTokenAmount.toFixed(0));
    } else {
      totalTokenAmount = Number(totalTokenAmount.toFixed(3));
    }

    let totalUsdValue = totalTokenAmount * tokenPrice;
    if (totalUsdValue > 1) {
      totalUsdValue = Number(totalUsdValue.toFixed(1));
    } else {
      totalUsdValue = Number(totalUsdValue.toFixed(3));
    }
    const simulated: SimulatedToken = {
      simulation: true,
      tokenMint: outputMint,
      tokenBalance: totalTokenAmount,
      usdValue: totalUsdValue,
      logoURI: logoData?.logoURI || DEFAULT_IMG,
      symbol: logoData?.symbol || 'No ticker',
    };
    data.tokensDisplay[outputMint] = simulated;

    await broadcastToClients(simulated);
    return { result: 'SIMULATED_BUY_' + Date.now() };
  } catch (err) {
    logger.error({ err, outputMint, solToSpend }, `Simulation Buy Error`);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function simulateSell(
  session: DemoSessionTypes,
  mint: string,
  tokenAmount: number,
  sellPercentage: number
): Promise<{ result?: string; error?: string } | void> {
  try {
    const data = session;
    if (!data || !data.tokensDisplay) {
      logger.warn('SimulateSell called with invalid session or display state');
      return { error: 'Invalid session or display state' };
    }

    const price = await getTokenPriceFallback(mint);
    if (price === null || price === undefined || price === 0) {
      logger.warn({ mint }, 'Failed to fetch token price for demo sell');
      return { error: 'Failed to fetch token price' };
    }

    const soldAmount = tokenAmount * (sellPercentage / 100);
    if (!isFinite(soldAmount)) {
      delete data.tokensDisplay[mint];
      await broadcastToClients({ tokenMint: mint, removed: true });
      return;
    }
    const usdEarned = soldAmount * price;
    data.currentUsd += usdEarned;

    setDemoAmount(session, mint, -soldAmount);
    let remainingAmount = getDemoAmount(session, mint);

    if (remainingAmount > 100) {
      remainingAmount = Number(remainingAmount.toFixed(0));
    } else {
      remainingAmount = Number(remainingAmount.toFixed(3));
    }

    if (sellPercentage === 100 || remainingAmount <= 0) {
      delete data.tokensDisplay[mint];
      await broadcastToClients({ tokenMint: mint, removed: true });
    } else {
      let totalUSD = remainingAmount * price;
      if (totalUSD > 1) {
        totalUSD = Number(totalUSD.toFixed(1));
      } else {
        totalUSD = Number(totalUSD.toFixed(3));
      }

      const logoData = await tokenLogo(mint);

      const simulated: SimulatedToken = {
        simulation: true,
        tokenMint: mint,
        tokenBalance: remainingAmount,
        usdValue: totalUSD,
        logoURI: logoData?.logoURI || DEFAULT_IMG,
        symbol: logoData?.symbol || 'No ticker',
      };
      data.tokensDisplay[mint] = simulated;

      await broadcastToClients(simulated);
    }

    // sessions.set(session, data);
    return { result: 'SIMULATED_' + Date.now() };
  } catch (err) {
    logger.error({ err, mint, tokenAmount, sellPercentage }, `Simulation Sell Error`);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function broadcastToClients(data: BroadcastMessage) {
  try {
    // Publish to a new channel dedicated to demo updates
    await redisClient.publish('ws-demo-broadcast', JSON.stringify(data));
  } catch (err) {
    logger.error({ err }, 'Failed to publish demo WebSocket message to Redis');
  }
}
