export interface BuyBody {
  mint: string;
  buyAmount: number;
  slippage?: number;
  fee?: number;
  jitoFee?: number;
  node?: boolean;
}

export interface ExecuteResult {
  result?: string;
  limit?: string;
  error?: any;
  message?: string;
  details?: any;
}

export interface validBuyBody extends BuyBody {
  slippage: number; // No longer optional
  fee: number; // No longer optional
  jitoFee: number; // No longer optional
  node: boolean; // No longer optional
}

export interface validSellBody extends SellBody {
  slippage: number; // No longer optional
  fee: number; // No longer optional
  jitoFee: number; // No longer optional
  node: boolean; // No longer optional
}

export interface SellBody {
  outputMint: string;
  amount: number;
  slippage: number;
  fee?: number;
  jitoFee?: number;
  node?: boolean;
}

export interface DemoSession {
  tokens: Record<string, number>;
  currentUsd: number;
  initialAmount: number;
  tokensDisplay?: {
    [mint: string]: {
      simulation: boolean;
      tokenMint: string;
      tokenBalance: number;
      usdValue: number;
      logoURI: string;
      symbol: string;
    };
  };
}

export interface decodedTx {
  tokenBalance: number;
  otherMint: string;
  valid?: boolean;
}

export interface content {
  preTokenBalances?: any[] | null;
  postTokenBalances?: any[] | null;
  preBalances?: any[] | null;
  postBalances?: any[] | null;
  fee: number;
}
export interface txObject {
  meta: content | null;
}

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

export interface JupPriceResponse {
  data: JupPriceData;
  timeTaken: number;
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

export interface BroadcastedToken {
  listToken: boolean;
  tokenMint: string;
  tokenBalance: number;
  usdValue: number;
  logoURI: string;
  symbol: string;
  removed?: boolean;
}

export interface SimulatedToken {
  simulation: true;
  tokenMint: string;
  tokenBalance: number;
  usdValue: number;
  logoURI: string;
  symbol: string;
}
export type BroadcastMessage =
  | BroadcastedToken
  | SimulatedToken
  | { tokenMint: string; removed: true };

export interface broadcastDelete {
  tokenMint: string;
  removed?: boolean;
}

export interface decodedTx {
  tokenBalance: number;
  otherMint: string;
}

export interface sendTxResult {
  error?: { message: string };
  result?: string;
}

export interface QuoteResponse {
  error?: string;
}

export interface SwapResponse {
  swapTransaction: string; // This is a base64 string
  computeUnitLimit: number; // This is a number
}

export interface Key {
  key: string;
}
