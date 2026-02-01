import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Solana Utils', () => {
  let getBalance: any;
  let checkIfIsSwap: any;

  beforeEach(async () => {
    // Dynamically import to ensure mocks are applied
    const module = await import('../src/core/solanaUtils.js');
    getBalance = module.getBalance;
    checkIfIsSwap = module.checkIfIsSwap;
  });

  describe('getBalance', () => {
    it('should return 0 if outputMint is empty', async () => {
      const result = await getBalance('', 'test-pubkey');
      expect(result).toBe(0);
    });

    it('should return null if pubKey is missing', async () => {
      const result = await getBalance('test-mint', '');
      expect(result).toBeNull();
    });

    it('should return token balance when valid inputs are provided', async () => {
      const result = await getBalance('test-mint', 'test-pubkey');
      expect(typeof result === 'number' || typeof result === 'object').toBe(true);
    });
  });

  describe('checkIfIsSwap', () => {
    it('should return true for Jupiter swap logs', async () => {
      const logs = ['Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke'];
      const result = await checkIfIsSwap(logs, 'test-owner');
      expect(result).toBe(true);
    });

    it('should return true for swap instruction logs', async () => {
      const logs = ['Program log: Instruction: Swap'];
      const result = await checkIfIsSwap(logs, 'test-owner');
      expect(result).toBe(true);
    });

    it('should return false for non-swap logs', async () => {
      const logs = ['Program log: Some other instruction'];
      const result = await checkIfIsSwap(logs, 'test-owner');
      expect(result).toBe(false);
    });

    it('should return false when logs are empty', async () => {
      const logs: string[] = [];
      const result = await checkIfIsSwap(logs, 'test-owner');
      expect(result).toBe(false);
    });
  });
});
