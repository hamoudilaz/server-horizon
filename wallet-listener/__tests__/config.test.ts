import { describe, it, expect } from '@jest/globals';

describe('Config', () => {
  describe('redisClient', () => {
    it('should have makeRedisClient available from shared', async () => {
      const { makeRedisClient } = await import('@horizon/shared');
      expect(makeRedisClient).toBeDefined();
      expect(typeof makeRedisClient).toBe('function');
    });
  });

  describe('environment variables', () => {
    it('should have REDIS_URL set in test environment', () => {
      expect(process.env.REDIS_URL).toBeDefined();
    });

    it('should have RPC_URL set in test environment', () => {
      expect(process.env.RPC_URL).toBeDefined();
    });

    it('should have WSS_URL set in test environment', () => {
      expect(process.env.WSS_URL).toBeDefined();
    });
  });
});
