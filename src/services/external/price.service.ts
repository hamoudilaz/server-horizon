import dotenv from 'dotenv';
import { solMint } from '../../config/constants.js';
import { BirdeyePriceResponse, TokenLogoInfo, HeliusAssetResponse, JupPriceData } from '../../core/types/interfaces.js';

dotenv.config();

// Get Balance
export async function totalOwned(mint: string, mytokens: number): Promise<string> {
  try {
    let tokenPrice: number;

    const res = await fetch(`https://public-api.birdeye.so/defi/price?address=${mint}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-chain': 'solana',
        'X-API-KEY': process.env.BIRDEYE_APIKEY!,
      },
    });

    const { data }: BirdeyePriceResponse = await res.json();

    if (!data?.value) {
      tokenPrice = await getTokenPriceFallback(mint);
    } else {
      tokenPrice = data.value;
    }

    return (mytokens * tokenPrice).toFixed(5);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    console.error('Error fetching token price:', err);
    throw new Error(message);
  }
}

export async function getTokenPriceFallback(mint: string): Promise<number> {
  let tokenPrice: number;
  const priceResponse = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`);
  const priceData: JupPriceData = await priceResponse.json();

  if (!priceData || !priceData[mint] || !priceData[mint]?.usdPrice) {
    tokenPrice = await getGeckoTerminalPrice(mint);
  } else {
    tokenPrice = priceData[mint]?.usdPrice;
  }

  return tokenPrice;
}

async function getGeckoTerminalPrice(mint: string): Promise<number> {
  try {
    const res = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${mint}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
    const { data } = await res.json();
    const raw = data?.attributes?.token_prices?.[mint];
    if (!raw) return 0;
    return Number(Number(raw).toFixed(10));
  } catch (err) {
    console.error(err);
    return 0;
  }
}

export async function tokenLogo(mint: string): Promise<TokenLogoInfo | null> {
  if (!mint) return null;
  try {
    if (mint !== solMint) {
      const response = await fetch(process.env.RPC_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAsset',
          params: {
            id: mint,
          },
        }),
      });

      const data: HeliusAssetResponse = await response.json();

      const content = data?.result?.content;

      if (!content || !content.files || !content.files[0]) {
        const res = await fetch(`https://lite-api.jup.ag/tokens/v1/token/${mint}`);

        const { logoURI, symbol, decimals } = await res.json();
        if (!logoURI || !symbol || typeof decimals !== 'number') return null;
        return { logoURI, symbol, decimals };
      }

      return {
        logoURI: content.files[0].uri,
        symbol: content.metadata?.symbol ?? 'No Ticker',
        decimals: data?.result.token_info?.decimals ?? 6,
      };
    } else {
      return null;
    }
  } catch (e) {
    console.error('Error retrieving token logo:', e);
    throw e;
  }
}

export async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const pair = await res.json();
    if (!pair.solana) {
      return await getSolPriceFallback();
    }

    return Number(pair.solana.usd);
  } catch {
    return 0;
  }
}

export async function getSolPriceFallback(): Promise<number> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot');
    const pair = await res.json();
    return Number(pair?.data?.amount);
  } catch {
    return 0;
  }
}
