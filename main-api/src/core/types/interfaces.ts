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
  error?: string;
  message?: string;
  details?: string;
  signature?: string;
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

export interface decodedTx {
  tokenBalance: number;
  otherMint: string;
  valid?: boolean;
}

type TokenBalance = {
  owner?: string;
  mint: string;
  uiTokenAmount: { amount: string };
};

export interface Content {
  preTokenBalances?: TokenBalance[] | null;
  postTokenBalances?: TokenBalance[] | null;
  preBalances?: number[] | null;
  postBalances?: number[] | null;
  fee: number;
}

export interface txObject {
  meta: Content | null;
}

export interface sendTxResult {
  error?: { message: string };
  result?: string;
  signature?: string;
}

export interface QuoteResponse {
  error?: string;
}

export interface SwapResponse {
  swapTransaction: string; // This is a base64 string
  computeUnitLimit: number; // This is a number
  simulationError?: {
    errorCode: string;
    error: string;
  };
}
