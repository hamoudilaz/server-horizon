
import dotenv from 'dotenv';
import { solMint, connection } from './constants.js';

dotenv.config();

// Get Balance
export async function totalOwned(mint, mytokens) {
    try {
        let tokenPrice;

        const res = await fetch(`https://public-api.birdeye.so/defi/price?address=${mint}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-chain': 'solana',
                'X-API-KEY': process.env.BIRDEYE_APIKEY,
            },
        });

        const { data } = await res.json()


        if (!data?.value) {

            tokenPrice = await getTokenPriceFallback(mint)
        } else {
            tokenPrice = parseFloat(data.value)
        }

        let pricetotal = mytokens * tokenPrice;


        return pricetotal.toFixed(5);
    } catch (error) {
        console.error('Error fetching token price:', error);
        return {
            error: error.message,
        };
    }
}



async function getTokenPriceFallback(mint) {

    let tokenPrice
    const priceResponse = await fetch(`https://lite-api.jup.ag/price/v2?ids=${mint}`);
    const priceData = await priceResponse.json();

    if (!priceData?.data[mint]?.price) {
        tokenPrice = await getGeckoTerminalPrice(mint)
    } else {
        tokenPrice = parseFloat(priceData.data[mint].price);
    }
    return tokenPrice


}



async function getGeckoTerminalPrice(mint) {

    try {
        const res = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${mint}`, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });
        const { data } = await res.json();
        const price = data?.attributes?.token_prices[mint]
        return Number(price).toFixed(10)
    } catch (err) {
        console.error(err);
    }
}


export async function tokenLogo(mint) {
    if (!mint) return null;
    try {
        if (mint !== solMint) {
            const response = await fetch(process.env.RPC_URL, {
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

            const data = await response.json();

            const content = data?.result?.content;

            if (!content || !content.files || !content.files[0]) {
                const res = await fetch(`https://lite-api.jup.ag/tokens/v1/token/${mint}`);

                const { logoURI, symbol, decimals } = await res.json();
                if (!logoURI || !symbol || !decimals) return null;
                return { logoURI, symbol, decimals };
            }

            const logoURI = content.files[0].uri;
            const symbol = content.metadata?.symbol ?? null;
            const decimals = data?.result.token_info?.decimals ?? null;

            return { logoURI, symbol, decimals };
        } else {
            return null;
        }
    } catch (e) {
        console.error('Error retrieving token logo:', e);
        throw e;
    }
}



export async function getSolPrice() {
    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        );
        const pair = await res.json();
        console.log("price at main func:", pair)
        return pair?.solana?.usd;
    } catch (err) {

        return { error: err };
    }
}

export async function getSolPriceFallback() {
    try {
        const res = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot');
        const pair = await res.json();
        console.log("price at fallback func:", pair)
        return Number(pair?.data?.amount)
    } catch (err) {
        return { error: err };
    }
}
