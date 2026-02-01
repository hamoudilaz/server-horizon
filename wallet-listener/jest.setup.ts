import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RPC_URL = 'https://mock-rpc.solana.com';
process.env.WSS_URL = 'wss://mock-wss.solana.com';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(() => Promise.resolve()),
  quit: jest.fn(() => Promise.resolve()),
  get: jest.fn((key: string) => {
    if (key.includes('trackedTokens')) return Promise.resolve(JSON.stringify({}));
    if (key.includes('solPrice')) return Promise.resolve('150');
    return Promise.resolve(null);
  }),
  set: jest.fn(() => Promise.resolve('OK')),
  publish: jest.fn(() => Promise.resolve(1)),
  on: jest.fn(),
};

// Mock @horizon/shared
jest.unstable_mockModule('@horizon/shared', async () => {
  // @ts-expect-error - jest.importActual exists at runtime
  const actual = await jest.importActual<object>('@horizon/shared');

  return {
    __esModule: true,
    ...actual,
    makeRedisClient: jest.fn(() => mockRedisClient),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
    },
    NODE_ENV: 'test',
    REDIS_URL: 'redis://localhost:6379',
    RPC_URL: 'https://mock-rpc.solana.com',
    WSS_URL: 'wss://mock-wss.solana.com',
    solMint: 'So11111111111111111111111111111111111111112',
    TOKEN_KEY_PREFIX: 'trackedTokens:',
    WS_MESSAGES_CHANNEL: 'ws:messages',
  };
});

// Mock Solana Connection
const mockConnection = {
  getParsedTokenAccountsByOwner: jest.fn(() =>
    Promise.resolve({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  tokenAmount: { amount: '1000000' },
                },
              },
            },
          },
        },
      ],
    })
  ),
  getTransaction: jest.fn(() =>
    Promise.resolve({
      meta: {
        preTokenBalances: [],
        postTokenBalances: [],
        preBalances: [1000000000],
        postBalances: [999000000],
        fee: 5000,
        logMessages: ['Program log: Instruction: Swap'],
      },
    })
  ),
  onAccountChange: jest.fn(() => 1), // subscription ID
  removeAccountChangeListener: jest.fn(() => Promise.resolve()),
};

jest.unstable_mockModule('@solana/web3.js', () => ({
  Connection: jest.fn(() => mockConnection),
  PublicKey: jest.fn((address: string) => ({ toBase58: () => address })),
  Keypair: jest.fn(),
}));
