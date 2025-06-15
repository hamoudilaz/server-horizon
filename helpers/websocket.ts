import { Connection, PublicKey } from '@solana/web3.js';
import { totalOwned, tokenLogo } from './helper.js';
import { setHeldAmount } from '../utils/globals.js';
import getTx from '../utils/decodeTx.js';
import { connection, wss, DEFAULT_IMG } from './constants.js';
import { BroadcastedToken } from '../types/interfaces.js';

let tokens: { [mint: string]: BroadcastedToken } = {};

async function listenToWallets(wallet: string) {
  try {
    connection.onLogs(
      new PublicKey(wallet),
      async (logs, context) => {
        const signature = logs.signature;
        const res = await getTx(signature);
        if ('error' in res) return; // skip errored tx
        const tx = res;
        let tokenBalance = tx.tokenBalance;

        console.log('Res at listneer:', res);
        let otherMint = tx.otherMint;

        setHeldAmount(otherMint, tokenBalance);
        if (tokenBalance >= 3) {
          const logoData = await tokenLogo(otherMint);

          tokenBalance = tokenBalance / 10 ** (logoData?.decimals ?? 6);

          const totalTokenValue = await totalOwned(otherMint, tokenBalance);

          tokens[otherMint] = {
            listToken: true,
            tokenMint: otherMint,
            tokenBalance,
            usdValue: Number(totalTokenValue) || NaN,
            logoURI: logoData?.logoURI || DEFAULT_IMG,
            symbol: logoData?.symbol || 'No ticker',
          };
          broadcastToClients(tokens[otherMint]);
        } else {
          delete tokens[otherMint];
          broadcastToClients({ tokenMint: otherMint, removed: true });
        }
      },
      'confirmed'
    );
  } catch (err) {
    console.error('Error listening to wallets:', err);
  }
}

export function broadcastToClients(data: BroadcastedToken | { tokenMint: string; removed: true }) {
  wss.clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export async function refreshTokenPrices() {
  for (const mint in tokens) {
    const updatedValue = await totalOwned(mint, tokens[mint].tokenBalance);
    tokens[mint].usdValue = Number(updatedValue);
    broadcastToClients(tokens[mint]);
  }
  return tokens;
}
// setInterval(refreshTokenPrices, 30000);

export async function start(wallet: string) {
  try {
    // ourBalance = (await getOwnBalance()) * 1e6;

    await listenToWallets(wallet);
  } catch (error: any) {
    console.error('start error:', error.message);
  }
}

// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* export async function retrieveWalletStateWithTotal(wallet_address) {
    try {

        const data = await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${wallet_address}`);
        const tokenAcc = await data.json()
        console.log(tokenAcc)

        const mintsToFetch = Object.keys(tokenAcc).filter(key => key !== "SOL");

        const priceResponse = await fetch(`https://api.jup.ag/price/v2?ids=${mintsToFetch.join(',')}`);
        const priceData = await priceResponse.json();
        // console.log(priceData)

        const transformedResults = [];
        // console.log(priceData)

        for (const [key, info] of Object.entries(priceData.data)) {
            const mint = info.id;
            if (mint === solMint) continue;

            const price = parseFloat(info.price);

            const pricetotal = tokenAcc[mint].uiAmount * price;

            const tokenInfo = await tokenLogo(mint);

            // const totalTokenValue = await totalOwned(mint, tokenAcc[mint].uiAmount);


            let token = {
                tokenMint: mint,
                tokenBalance: tokenAcc[mint].uiAmount,
                usdValue: pricetotal,
                logoURI: tokenInfo?.logoURI || "No logo",
                symbol: tokenInfo?.symbol || "No ticker"
            };


            transformedResults.push(token);


        }

        console.log(transformedResults)




        broadcastToClients(transformedResults)
        return transformedResults;
    } catch (e) {
        console.error('bad wallet state:', e);
        throw e;
    }
} */

export { tokens };
