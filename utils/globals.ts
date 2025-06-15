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
  const s = session;
  if (!s) return;
  const prev = s.tokens.get(mint) || 0;
  const updated = prev + amount;
  if (updated <= 0) {
    s.tokens.delete(mint);
  } else {
    s.tokens.set(mint, updated);
  }
}

export function getDemoAmount(session: DemoSession, mint: string) {
  const s = session;
  return s?.tokens.get(mint) || 0;
}
