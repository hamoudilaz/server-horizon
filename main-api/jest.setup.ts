import { jest } from '@jest/globals';

// 1. Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        SOL: { uiAmount: 1.5 },
        So11111111111111111111111111111111111111112: { uiAmount: 0.5 },
        'EKpQGSJtjMFqKZ9zmiwbviJBNNsmzjuFhW3wUfM-Test': { uiAmount: 100 },
      }),
  })
) as unknown as typeof fetch; // <-- FIX 1: Use 'as unknown as typeof fetch' to force the type

// 2. Mock Redis and RedisStore
jest.unstable_mockModule('./src/config/redis.js', () => ({
  redisClient: {
    get: jest.fn((key: string) => {
      if (key === 'solPrice') return Promise.resolve('150');
      if (key.startsWith('tokens:')) return Promise.resolve(JSON.stringify({}));
      return Promise.resolve(null);
    }),
    set: jest.fn((key: string, value: string, options?: unknown) => Promise.resolve('OK')),
    sAdd: jest.fn((key: string, ...members: string[]) => Promise.resolve(members.length)),
    sRem: jest.fn((key: string, ...members: string[]) => Promise.resolve(members.length)),
    del: jest.fn((...keys: string[]) => Promise.resolve(keys.length)),
    publish: jest.fn((channel: string, message: string) => Promise.resolve(1)),
    on: jest.fn(),
    connect: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
    duplicate: jest.fn(() => ({
      on: jest.fn(),
      connect: jest.fn(() => Promise.resolve()),
      quit: jest.fn(() => Promise.resolve()),
    })),
  },
  pubSubClient: {
    on: jest.fn(),
    connect: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
  },
  redisStore: {
    get: jest.fn((sid: string, callback: Function) => callback(null, null)),
    set: jest.fn((sid: string, session: unknown, callback: Function) => callback(null)),
    destroy: jest.fn((sid: string, callback: Function) => callback(null)),
    touch: jest.fn((sid: string, session: unknown, callback: Function) => callback(null)),
    all: jest.fn((callback: Function) => callback(null, [])),
  },
}));

// 3. Mock Solana Connection
jest.unstable_mockModule('./src/services/solana/panel.js', () => ({
  connection: {
    getParsedTokenAccountsByOwner: jest.fn(() =>
      Promise.resolve({
        value: [
          {
            account: {
              data: {
                parsed: { info: { tokenAmount: { amount: '5000000' } } },
              },
            },
          },
        ],
      })
    ),
    getMinimumBalanceForRentExemption: jest.fn(() => Promise.resolve(2039280)),
    getTokenLargestAccounts: jest.fn(() =>
      Promise.resolve({
        value: [{ address: 'some-other-address', amount: '1000' }],
      })
    ),
    sendAndConfirmTransaction: jest.fn(() => Promise.resolve('mock-tx-signature-for-cleanup')),
  },
  getBalance: jest.fn(() => Promise.resolve(5000000)),
}));

// 4. Mock @horizon/shared
jest.unstable_mockModule('@horizon/shared', async () => {
  // @ts-expect-error - FIX 2: This is a known type issue with @jest/globals.
  // The 'jest' object has 'importActual' at runtime, but not in its type definition.
  const actual = await jest.importActual<object>('@horizon/shared');

  return {
    __esModule: true,
    ...actual,
    tokenLogo: jest.fn(() => Promise.resolve({ logoURI: 'mock-logo.png', symbol: 'MOCK' })),
    getTotalOwnedTokens: jest.fn(() => Promise.resolve(123.45)),
    getTokenPriceFallback: jest.fn(() => Promise.resolve(0.5)),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
    },
    NODE_ENV: 'test',
    SESSION_SECRET: 'test-secret-key-12345678901234F_v2-FIX',
    ENCRYPTION_KEY: 'a'.repeat(64), // 32-byte hex string (64 hex characters)
    REDIS_URL: 'redis://localhost:6379',
    FRONTEND_URL_CORS: 'http://localhost:3000',
    solMint: 'So11111111111111111111111111111111111111112',
    makeRedisClient: jest.fn(() => ({
      get: jest.fn((key: string) => Promise.resolve(null)),
      set: jest.fn(() => Promise.resolve('OK')),
      sAdd: jest.fn(() => Promise.resolve(1)),
      sRem: jest.fn(() => Promise.resolve(1)),
      del: jest.fn(() => Promise.resolve(1)),
      publish: jest.fn(() => Promise.resolve(1)),
      on: jest.fn(),
      connect: jest.fn(() => Promise.resolve()),
      quit: jest.fn(() => Promise.resolve()),
      duplicate: jest.fn(() => ({
        on: jest.fn(),
        connect: jest.fn(() => Promise.resolve()),
        quit: jest.fn(() => Promise.resolve()),
      })),
    })),
  };
});
