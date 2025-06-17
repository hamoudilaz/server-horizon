import { Agent, request } from 'undici';

export const agent = new Agent({
  connections: 2, // Solo user, no need for concurrency
  keepAliveTimeout: 30_0000, // 30s idle before closing connection
  keepAliveMaxTimeout: 3000000, // 1 hour max connection lifespan
  connect: {
    family: 4, // Force IPv4 directly
    maxCachedSessions: 5, // Store TLS sessions to speed reconnects
  },
});

export async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, ms);

  try {
    const { statusCode, body: quoteRes } = await request(url, {
      dispatcher: agent,
      signal: controller.signal,
    });

    if (statusCode === 429) return { limit: 'Rate limit exeeded' };
    return quoteRes;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWithTimeoutSwap(url: string, ms: number, payload: object) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, ms);

  try {
    const { statusCode, body: swapRes } = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      dispatcher: agent,
      signal: controller.signal,
    });
    if (statusCode === 429) return { limit: 'Rate limit exeeded' };
    return swapRes;
  } finally {
    clearTimeout(timeout);
  }
}
