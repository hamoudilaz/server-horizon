import { DemoSessionTypes } from './demo.types.js';

export function setDemoAmount(session: DemoSessionTypes, mint: string, amount: number) {
  if (!session || !session.tokens) return;

  const prev = session.tokens[mint] ?? 0;
  const updated = prev + amount;
  if (updated <= 0) {
    delete session.tokens[mint];
  } else {
    session.tokens[mint] = updated;
  }
}

export function getDemoAmount(session: DemoSessionTypes, mint: string) {
  if (!session || !session.tokens) return 0;
  return session.tokens[mint] ?? 0;
}
