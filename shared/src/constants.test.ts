import { describe, it, expect } from '@jest/globals';
import {
  SOL_PRICE_KEY,
  SOL_PRICE_TTL,
  ACTIVE_WALLETS_KEY,
  TOKEN_KEY_PREFIX,
  WS_MESSAGES_CHANNEL,
  solMint,
  DEFAULT_IMG,
  jitoTipWallets,
  bloxrouteTipWallets,
} from './constants.js';

describe('Constants', () => {
  describe('Redis keys', () => {
    it('should have correct SOL_PRICE_KEY', () => {
      expect(SOL_PRICE_KEY).toBe('solPrice');
    });

    it('should have correct SOL_PRICE_TTL', () => {
      expect(SOL_PRICE_TTL).toBe(300);
    });

    it('should have correct ACTIVE_WALLETS_KEY', () => {
      expect(ACTIVE_WALLETS_KEY).toBe('active_wallets');
    });

    it('should have correct TOKEN_KEY_PREFIX', () => {
      expect(TOKEN_KEY_PREFIX).toBe('tokens:');
    });

    it('should have correct WS_MESSAGES_CHANNEL', () => {
      expect(WS_MESSAGES_CHANNEL).toBe('ws-messages');
    });
  });

  describe('Solana constants', () => {
    it('should have correct solMint address', () => {
      expect(solMint).toBe('So11111111111111111111111111111111111111112');
      expect(solMint.length).toBe(43); // Solana public key length
    });

    it('should have valid DEFAULT_IMG URL', () => {
      expect(DEFAULT_IMG).toContain('https://');
      expect(DEFAULT_IMG).toContain('solana-labs/token-list');
    });
  });

  describe('Tip wallets', () => {
    it('should have Jito tip wallets', () => {
      expect(jitoTipWallets).toBeInstanceOf(Array);
      expect(jitoTipWallets.length).toBeGreaterThan(0);
      jitoTipWallets.forEach((wallet) => {
        expect(wallet.length).toBe(44); // Solana public key length
        expect(typeof wallet).toBe('string');
      });
    });

    it('should have Bloxroute tip wallets', () => {
      expect(bloxrouteTipWallets).toBeInstanceOf(Array);
      expect(bloxrouteTipWallets.length).toBeGreaterThan(0);
      bloxrouteTipWallets.forEach((wallet) => {
        expect(wallet.length).toBe(44); // Solana public key length
        expect(typeof wallet).toBe('string');
      });
    });

    it('should not have duplicate tip wallets', () => {
      const allWallets = [...jitoTipWallets, ...bloxrouteTipWallets];
      const uniqueWallets = new Set(allWallets);
      expect(uniqueWallets.size).toBe(allWallets.length);
    });
  });
});
