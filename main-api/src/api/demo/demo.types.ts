export interface DemoSessionTypes {
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
