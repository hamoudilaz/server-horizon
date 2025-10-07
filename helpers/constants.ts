import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { Server } from 'http';

dotenv.config();

export const connection = new Connection(process.env.RPC_URL!, {
  wsEndpoint: process.env.WSS_URL,
  commitment: 'confirmed',
});

export const solMint = 'So11111111111111111111111111111111111111112' as const;

export const nextBlockTipWallets = [
  'NextbLoCkVtMGcV47JzewQdvBpLqT9TxQFozQkN98pE',
  'NexTbLoCkWykbLuB1NkjXgFWkX9oAtcoagQegygXXA2',
  'NeXTBLoCKs9F1y5PJS9CKrFNNLU1keHW71rfh7KgA1X',
  'NexTBLockJYZ7QD7p2byrUa6df8ndV2WSd8GkbWqfbb',
  'neXtBLock1LeC67jYd1QdAa32kbVeubsfPNTJC1V5At',
  'nEXTBLockYgngeRmRrjDV31mGSekVPqZoMGhQEZtPVG',
  'NEXTbLoCkB51HpLBLojQfpyVAMorm3zzKg7w9NFdqid',
  'nextBLoCkPMgmG8ZgJtABeScP35qLa2AMCNKntAP7Xc',
] as const;

export const zeroSlotTipWallets = [
  '4HiwLEP2Bzqj3hM2ENxJuzhcPCdsafwiet3oGkMkuQY4',
  '7toBU3inhmrARGngC7z6SjyP85HgGMmCTEwGNRAcYnEK',
  '8mR3wB1nh4D6J9RUCugxUpc6ya8w38LPxZ3ZjcBhgzws',
  '6SiVU5WEwqfFapRuYCndomztEwDjvS5xgtEof3PLEGm9',
  'TpdxgNJBWZRL8UXF5mrEsyWxDWx9HQexA9P1eTWQ42p',
  'D8f3WkQu6dCF33cZxuAsrKHrGsqGP2yvAHf8mX6RXnwf',
  'GQPFicsy3P3NXxB5piJohoxACqTvWE9fKpLgdsMduoHE',
  'Ey2JEr8hDkgN8qKJGrLf2yFjRhW7rab99HVxwi5rcvJE',
  '4iUgjMT8q2hNZnLuhpqZ1QtiV8deFPy2ajvvjEpKKgsS',
  '3Rz8uD83QsU8wKvZbgWAPvCNDU6Fy8TSZTMcPm3RB6zt',
] as const;

export const jitoTipWallets = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
];

export const nozomiTipWallets = [
  'TEMPaMeCRFAS9EKF53Jd6KpHxgL47uWLcpFArU1Fanq',
  'noz3jAjPiHuBPqiSPkkugaJDkJscPuRhYnSpbi8UvC4',
  'noz3str9KXfpKknefHji8L1mPgimezaiUyCHYMDv1GE',
  'noz6uoYCDijhu1V7cutCpwxNiSovEwLdRHPwmgCGDNo',
  'noz9EPNcT7WH6Sou3sr3GGjHQYVkN3DNirpbvDkv9YJ',
  'nozc5yT15LazbLTFVZzoNZCwjh3yUtW86LoUyqsBu4L',
  'nozFrhfnNGoyqwVuwPAW4aaGqempx4PU6g6D9CJMv7Z',
  'nozievPk7HyK1Rqy1MPJwVQ7qQg2QoJGyP71oeDwbsu',
  'noznbgwYnBLDHu8wcQVCEw6kDrXkPdKkydGJGNXGvL7',
  'nozNVWs5N8mgzuD3qigrCG2UoKxZttxzZ85pvAQVrbP',
  'nozpEGbwx4BcGp6pvEdAh1JoC2CQGZdU6HbNP1v2p6P',
  'nozrhjhkCr3zXT3BiT4WCodYCUFeQvcdUkM7MqhKqge',
  'nozrwQtWhEdrA6W8dkbt9gnUaMs52PdAv5byipnadq3',
  'nozUacTVWub3cL4mJmGCYjKZTnE9RbdY5AP46iQgbPJ',
  'nozWCyTPppJjRuw2fpzDhhWbW355fzosWSzrrMYB1Qk',
  'nozWNju6dY353eMkMqURqwQEoM3SFgEKC6psLCSfUne',
  'nozxNBgWohjR75vdspfxR5H9ceC7XXH99xpxhVGt3Bb',
] as const;

export const bloxrouteTipWallets = [
  'HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY',
  '95cfoy472fcQHaw4tPGBTKpn6ZQnfEPfBgDQx6gcRmRg',
  '3UQUKjhMKaY2S6bjcQD6yHB7utcZt5bfarRCmctpRtUd',
  'FogxVNs6Mm2w9rnGL1vkARSwJxvLE8mujTv3LK8RnUhF',
] as const;

export function calculateFee(fee: number, unitLimit: number) {
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const MICROLAMPORTS_PER_LAMPORT = 1_000_000;

  const totalLamports = fee * LAMPORTS_PER_SOL;
  const totalMicroLamports = totalLamports * MICROLAMPORTS_PER_LAMPORT;
  let microLamportsPerUnit = Math.floor(totalMicroLamports / unitLimit);

  if (microLamportsPerUnit < 1) {
    microLamportsPerUnit = 1;
  }

  return microLamportsPerUnit;
}

import { WebSocket } from 'ws'; // Make sure to import WebSocket type
import { userConnections } from '../utils/globals.js';

export let wss: WebSocketServer;
export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws: WebSocket & { pubKey?: string; clientId?: string }) => {
    console.log('Frontend WebSocket client connected');

    ws.on('close', () => {
      console.log('Frontend WebSocket client disconnected');
      if (ws.pubKey) {
        userConnections.delete(ws.pubKey); // Clean up on disconnect
      }
    });

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        // Expect a message like { type: 'auth', pubKey: '...' } from the client
        if (data.type === 'auth' && data.pubKey && data.clientId) {
          ws.pubKey = data.pubKey;
          ws.clientId = data.clientId;

          // If no Map exists for this pubKey, create it
          if (!userConnections.has(data.pubKey)) {
            userConnections.set(data.pubKey, new Map());
          }

          // Store this client's WebSocket in the sub-map
          userConnections.get(data.pubKey)!.set(data.clientId, ws);
          console.log(`WebSocket registered: pubKey=${data.pubKey}, clientId=${data.clientId}`);
        }
      } catch (e) {
        console.log('Received non-JSON message:', message);
      }
    });
  });
}

export const DEFAULT_IMG =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
