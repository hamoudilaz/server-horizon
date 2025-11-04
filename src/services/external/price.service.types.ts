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
