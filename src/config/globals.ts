import { BroadcastedToken, DemoSession } from '../core/types/interfaces.js';
import { WebSocket } from 'ws';
import { Keypair } from '@solana/web3.js';

export const userConnections = new Map<string, Map<string, WebSocket>>();
export const userTrackedTokens = new Map<string, { [mint: string]: BroadcastedToken }>();
export const secureWalletStore = new Map<string, Keypair>(); // pubKey -> Keypair

export function setDemoAmount(session: DemoSession, mint: string, amount: number) {
  if (!session || !session.tokens) return;

  const prev = session.tokens[mint] ?? 0;
  const updated = prev + amount;
  if (updated <= 0) {
    delete session.tokens[mint];
  } else {
    session.tokens[mint] = updated;
  }
}

export function getDemoAmount(session: DemoSession, mint: string) {
  if (!session || !session.tokens) return 0;
  return session.tokens[mint] ?? 0;
}
