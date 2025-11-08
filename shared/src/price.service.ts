import {
  BirdeyePriceResponse,
  TokenLogoInfo,
  HeliusAssetResponse,
  JupPriceData,
  logger,
  RPC_URL,
  BIRDEYE_APIKEY,
  solMint,
} from './index.js';

// Get Balance
export async function getTotalOwnedTokens(mint: string, mytokens: number): Promise<number> {
  try {
    let tokenPrice: number;

    if (!BIRDEYE_APIKEY) {
      logger.warn('BIRDEYE_APIKEY not set, using fallback for token price');
      return 0;
    }

    const res = await fetch(`https://public-api.birdeye.so/defi/price?address=${mint}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-chain': 'solana',
        'X-API-KEY': BIRDEYE_APIKEY,
      },
    });

    const { data }: BirdeyePriceResponse = await res.json();

    if (!data?.value) {
      logger.warn({ mint }, 'Birdeye price not found, using fallback');
      tokenPrice = await getTokenPriceFallback(mint);
    } else {
      tokenPrice = data.value;
    }

    const totalvalue = (mytokens * tokenPrice).toFixed(4);
    return Number(totalvalue);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, mint }, `Error fetching token price: ${message}`);
    throw new Error(message);
  }
}

// TOKEN PRICE FETCHERS
export async function getTokenPriceFallback(mint: string): Promise<number> {
  let tokenPrice: number;
  try {
    const priceResponse = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`);
    const priceData: JupPriceData = await priceResponse.json();

    if (!priceData || !priceData[mint] || !priceData[mint]?.usdPrice) {
      logger.warn({ mint }, 'Jupiter price not found, using GeckoTerminal fallback');
      tokenPrice = await getGeckoTerminalPrice(mint);
    } else {
      tokenPrice = priceData[mint]?.usdPrice;
    }
  } catch (err) {
    logger.warn({ err, mint }, 'Jupiter price fetch failed, using GeckoTerminal fallback');
    tokenPrice = await getGeckoTerminalPrice(mint);
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
    if (!raw) {
      logger.error({ mint }, 'Failed to get price from GeckoTerminal last fallback, skipping token');
      return 0;
    }
    const tokenPrice = Number(Number(raw).toFixed(10));

    return tokenPrice;
  } catch (err) {
    logger.error({ err, mint }, `Error fetching token price from GeckoTerminal`);
    return 0;
  }
}

export async function tokenLogo(mint: string): Promise<TokenLogoInfo | null> {
  if (!mint) return null;
  try {
    if (mint !== solMint) {
      if (!RPC_URL) {
        logger.error('RPC_URL not set in environment variables');
        return null;
      }
      const response = await fetch(RPC_URL, {
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
        logger.warn({ mint }, 'Helius logo not found, falling back to Jupiter');
        const res = await fetch(`https://lite-api.jup.ag/tokens/v1/token/${mint}`);

        const { logoURI, symbol, decimals } = await res.json();
        if (!logoURI || !symbol || typeof decimals !== 'number') {
          logger.error({ mint }, 'Failed to get logo from Jupiter fallback');
          return null;
        }
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
  } catch (err) {
    logger.error({ err, mint }, `Error fetching token logo`);
    throw err;
  }
}

// SOL PRICE FETCHERS
export async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const pair = await res.json();
    if (!pair.solana) {
      logger.warn('CoinGecko SOL price fetch failed, falling back...');
      return await getSolPriceFallback();
    }

    return Number(pair.solana.usd);
  } catch (err) {
    logger.warn({ err }, 'Failed to get SOL price, returning 0.');
    return 0;
  }
}

export async function getSolPriceFallback(): Promise<number> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot');
    const pair = await res.json();
    if (!pair?.data?.amount) {
      logger.error('All SOL price fallbacks (Coinbase) failed');
      return 0;
    }
    return Number(pair?.data?.amount);
  } catch (err) {
    logger.error({ err }, 'All SOL price fallbacks (Coinbase) failed');
    return 0;
  }
}
