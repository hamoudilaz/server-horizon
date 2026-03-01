import { describe, it, expect } from '@jest/globals';
import type {
  BroadcastedToken,
  PortfolioToken,
  SimulatedToken,
  BroadcastMessage,
  BirdeyePriceData,
  JupPriceData,
  TokenLogoInfo,
} from './types.js';

describe('Types', () => {
  describe('BroadcastedToken', () => {
    it('should accept valid BroadcastedToken object', () => {
      const token: BroadcastedToken = {
        listToken: true,
        tokenMint: 'So11111111111111111111111111111111111111112',
        tokenBalance: 1000000,
        usdValue: 150.5,
        logoURI: 'https://example.com/logo.png',
        symbol: 'SOL',
      };
      expect(token.listToken).toBe(true);
      expect(token.tokenMint).toBeDefined();
      expect(token.tokenBalance).toBeGreaterThan(0);
    });

    it('should accept BroadcastedToken with removed flag', () => {
      const token: BroadcastedToken = {
        listToken: false,
        tokenMint: 'test-mint',
        tokenBalance: 0,
        usdValue: 0,
        logoURI: '',
        symbol: 'TEST',
        removed: true,
      };
      expect(token.removed).toBe(true);
    });
  });

  describe('PortfolioToken', () => {
    it('should accept valid PortfolioToken object', () => {
      const token: PortfolioToken = {
        tokenMint: 'test-mint',
        tokenBalance: 500,
        usdValue: 75.25,
      };
      expect(token.tokenMint).toBeDefined();
      expect(token.tokenBalance).toBe(500);
    });

    it('should accept PortfolioToken with optional fields', () => {
      const token: PortfolioToken = {
        tokenMint: 'test-mint',
        tokenBalance: 500,
        usdValue: 75.25,
        logoURI: 'https://example.com/logo.png',
        symbol: 'TEST',
      };
      expect(token.logoURI).toBeDefined();
      expect(token.symbol).toBeDefined();
    });
  });

  describe('SimulatedToken', () => {
    it('should accept valid SimulatedToken object', () => {
      const token: SimulatedToken = {
        simulation: true,
        tokenMint: 'simulated-mint',
        tokenBalance: 1000,
        usdValue: 100,
        logoURI: 'https://example.com/sim.png',
        symbol: 'SIM',
      };
      expect(token.simulation).toBe(true);
      expect(token.tokenMint).toBeDefined();
    });
  });

  describe('BirdeyePriceData', () => {
    it('should accept valid BirdeyePriceData object', () => {
      const priceData: BirdeyePriceData = {
        value: 150.5,
        updateUnixTime: Date.now(),
        updateHumanTime: new Date().toISOString(),
      };
      expect(priceData.value).toBeGreaterThan(0);
      expect(priceData.updateUnixTime).toBeGreaterThan(0);
    });
  });

  describe('JupPriceData', () => {
    it('should accept valid JupPriceData object', () => {
      const priceData: JupPriceData = {
        'So11111111111111111111111111111111111111112': {
          usdPrice: 150.5,
          blockId: 12345,
          decimals: 9,
          priceChange24h: 2.5,
        },
      };
      expect(Object.keys(priceData).length).toBeGreaterThan(0);
      expect(priceData['So11111111111111111111111111111111111111112'].usdPrice).toBeGreaterThan(0);
    });
  });

  describe('TokenLogoInfo', () => {
    it('should accept valid TokenLogoInfo object', () => {
      const logoInfo: TokenLogoInfo = {
        logoURI: 'https://example.com/logo.png',
        symbol: 'SOL',
        decimals: 9,
      };
      expect(logoInfo.logoURI).toContain('http');
      expect(logoInfo.symbol.length).toBeGreaterThan(0);
      expect(logoInfo.decimals).toBeGreaterThan(0);
    });
  });
});
