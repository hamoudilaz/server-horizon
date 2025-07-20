import { tokenLogo, totalOwned, getTokenPriceFallback, getSolPrice } from '../../helpers/helper.js';
import { wss } from '../../helpers/constants.js';
import { setDemoAmount, getDemoAmount } from '../globals.js';
import { DEFAULT_IMG } from '../../helpers/constants.js';
import { SimulatedToken, BroadcastMessage, DemoSession } from '../../types/interfaces.js';

import { WebSocket } from 'ws'; // <--- ADD THIS LINE

export async function simulateBuy(session: DemoSession, outputMint: string, solToSpend: number) {
  try {
    const data = session;
    if (!data) throw new Error('Invalid session');
    if (!data.tokensDisplay) data.tokensDisplay = {};

    const solPrice = await getSolPrice();
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
    console.log(tokenPrice);
    if (typeof tokenPrice === null || tokenPrice === undefined) {
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

    broadcastToClients(simulated);
    // sessions.set(session, data);
    return { result: 'SIMULATED_BUY_' + Date.now() };
  } catch (err) {
    console.error('Simulation Error:', err);
    return err;
  }
}

export async function simulateSell(
  session: DemoSession,
  mint: string,
  totalOwned: number,
  sellPercentage: number
) {
  try {
    const data = session;
    if (!data || !data.tokensDisplay) return { error: 'Invalid session or display state' };

    const price = await getTokenPriceFallback(mint);
    if (typeof price === null || price === undefined) {
      return { error: 'Failed to fetch token price' };
    }
    const soldAmount = totalOwned * (sellPercentage / 100);
    if (!isFinite(soldAmount)) {
      delete data.tokensDisplay[mint];
      broadcastToClients({ tokenMint: mint, removed: true });
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
      broadcastToClients({ tokenMint: mint, removed: true });
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

      broadcastToClients(simulated);
    }

    // sessions.set(session, data);
    return { result: 'SIMULATED_' + Date.now() };
  } catch (err) {
    console.error('Simulation Error:', err);
    return err;
  }
}

export function broadcastToClients(data: BroadcastMessage) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
