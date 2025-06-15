const held = new Map();
import { DemoSession } from '../types/interfaces.js';
export const sessions = new Map();

export function setHeldAmount(mint: string, amount: number) {
  held.set(mint, amount);
}

export function getHeldAmount(mint: string) {
  return held.get(mint) || 0;
}

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
