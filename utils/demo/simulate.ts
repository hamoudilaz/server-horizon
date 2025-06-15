import { tokenLogo, totalOwned, getTokenPriceFallback, getSolPrice } from '../../helpers/helper.js';
import { wss } from '../../helpers/constants.js';
import { setDemoAmount, getDemoAmount, sessions } from '../globals.js';
import { DEFAULT_IMG } from '../../helpers/constants.js';
import { SimulatedToken, BroadcastMessage, DemoSession } from '../../types/interfaces.js';

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

    const tokenPrice = await getTokenPriceFallback(outputMint);
    if (!tokenPrice) return { error: 'Failed to fetch token price' };

    const newTokenAmount = costInUsd / tokenPrice;

    data.currentUsd -= costInUsd;

    setDemoAmount(session, outputMint, newTokenAmount);

    const totalTokenAmount = getDemoAmount(session, outputMint);
    const totalUsdValue = totalTokenAmount * tokenPrice;

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

    const logoData = await tokenLogo(mint);
    const decimals = logoData?.decimals ?? 6;

    const price = await getTokenPriceFallback(mint);
    if (!price) throw new Error('Failed to fetch token price');

    const soldAmount = totalOwned * (sellPercentage / 100);
    const remaining = totalOwned - soldAmount;
    const usdEarned = soldAmount * price;
    data.currentUsd += usdEarned;

    setDemoAmount(session, mint, -soldAmount);
    const remainingAmount = getDemoAmount(session, mint);

    if (sellPercentage === 100 || remainingAmount <= 0) {
      delete data.tokensDisplay[mint];
      broadcastToClients({ tokenMint: mint, removed: true });
    } else {
      const totalUSD = remainingAmount * price;
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
