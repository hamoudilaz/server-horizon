import { Connection, PublicKey } from '@solana/web3.js';
import { totalOwned, tokenLogo } from './helper.js';
import getTx from '../utils/decodeTx.js';
import { connection, wss, DEFAULT_IMG } from './constants.js';
import { BroadcastedToken } from '../types/interfaces.js';
import { userConnections, userTrackedTokens } from '../utils/globals.js';
import { WebSocket } from 'ws';

export function sendToUser(pubKey: string, data: any) {
  const connection = userConnections.get(pubKey);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(data));
  }
}

async function listenToWallets(wallet: string) {
  try {
    connection.onLogs(
      new PublicKey(wallet),
      async (logs, context) => {
        const signature = logs.signature;
        const res = await getTx(signature);
        if ('error' in res) return; // skip errored tx
        const { otherMint, tokenBalance } = res;

        const userTokens = userTrackedTokens.get(wallet);
        if (!userTokens) return;
        let broadcastData;

        if (tokenBalance >= 3) {
          const logoData = await tokenLogo(otherMint);

          const uiTokenBalance = tokenBalance / 10 ** (logoData?.decimals ?? 6);

          const totalTokenValue = await totalOwned(otherMint, uiTokenBalance);

          broadcastData = {
            listToken: true,
            tokenMint: otherMint,
            tokenBalance: uiTokenBalance,
            usdValue: Number(totalTokenValue) || NaN,
            logoURI: logoData?.logoURI || DEFAULT_IMG,
            symbol: logoData?.symbol || 'No ticker',
          };

          userTokens[otherMint] = broadcastData;
        } else {
          broadcastData = { tokenMint: otherMint, removed: true };
          delete userTokens[otherMint];
        }
        sendToUser(wallet, broadcastData);
      },
      'confirmed'
    );
  } catch (err) {
    console.error('Error listening to wallets:', err);
  }
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
