import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

export const connection = new Connection(process.env.RPC_URL!, {
  wsEndpoint: process.env.WSS_SHYFT,
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

import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { parse } from 'cookie';
import { unsign } from 'cookie-signature';
import { Session } from 'fastify';

export let wss: WebSocketServer;
export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    try {
      if (!request.headers.cookie) {
        throw new Error('No cookie on upgrade request');
      }

      const cookies = parse(request.headers.cookie);
      const rawSessionId = cookies.sessionId;
      if (!rawSessionId) {
        throw new Error('No session ID in cookie');
      }

      const secret = process.env.SESSION_SECRET;
      if (!secret) {
        throw new Error('Session secret is not set');
      }
      const signedSessionId = 's:' + rawSessionId;
      const sessionId = unsign(signedSessionId, secret);

      if (!sessionId) {
        throw new Error('Invalid session ID');
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.error('WebSocket upgrade error:', err);
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    console.log('Frontend WebSocket client connected');

    ws.on('close', () => {
      console.log('Frontend WebSocket client disconnected');
    });

    ws.on('message', (message) => {
      console.log('Received from frontend:', message);
    });
  });
}

export const DEFAULT_IMG =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
