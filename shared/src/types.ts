export interface BroadcastedToken {
  listToken: boolean;
  tokenMint: string;
  tokenBalance: number;
  usdValue: number;
  logoURI: string;
  symbol: string;
  removed?: boolean;
}

export type PortfolioToken = {
  tokenMint: string;
  tokenBalance: number;
  usdValue: number;
  logoURI?: string;
  symbol?: string;
};

export interface SimulatedToken {
  simulation: true;
  tokenMint: string;
  tokenBalance: number;
  usdValue: number;
  logoURI: string;
  symbol: string;
}

export type BroadcastMessage = BroadcastedToken | SimulatedToken | { tokenMint: string; removed: boolean };

export interface BirdeyePriceData {
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
}

export interface BirdeyePriceResponse {
  data: BirdeyePriceData;
  success: boolean;
}

export interface JupPriceData {
  [key: string]: {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
  };
}

export interface HeliusAssetResponse {
  result: {
    content: {
      files: { uri: string }[];
      metadata?: { symbol?: string };
    };
    token_info?: {
      decimals?: number;
    };
  };
}

export interface TokenLogoInfo {
  logoURI: string;
  symbol: string;
  decimals: number;
}
