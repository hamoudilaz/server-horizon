export async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    const pair = await res.json();
    console.log(pair);
    if (!pair.solana) {
      return await getSolPriceFallback();
    }

    return pair.solana.usd;
  } catch (err) {
    return 0;
  }
}

export async function getSolPriceFallback(): Promise<number> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot');
    const pair = await res.json();
    return Number(pair?.data?.amount);
  } catch (err) {
    return 0;
  }
}

console.log(await getSolPrice());
