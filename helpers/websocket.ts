import { PublicKey } from '@solana/web3.js';
import { totalOwned, tokenLogo } from './helper.js';
import getTx from '../utils/decodeTx.js';
import { connection, DEFAULT_IMG } from './constants.js';
import { userConnections, userTrackedTokens } from '../utils/globals.js';
import { WebSocket } from 'ws';

export function sendToUser(pubKey: string, data: any) {
  const clients = userConnections.get(pubKey);
  if (!clients) return;

  for (const [, ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}


async function listenToWallets(wallet: string) {
  try {
    connection.onLogs(
      new PublicKey(wallet),
      async (logs, context) => {
        // console.log(logs, context);
        const signature = logs.signature;
        const res = await getTx(signature, wallet);
        if ('error' in res) return; 
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


export async function start(wallet: string) {
  try {


    await listenToWallets(wallet);
  } catch (error: any) {
    console.error('start error:', error.message);
  }
}
