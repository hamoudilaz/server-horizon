import { Connection, PublicKey } from '@solana/web3.js';
import { totalOwned, tokenLogo } from '../helpers/helper.js';
import { setHeldAmount } from '../utils/globals.js';
import getTx from '../utils/decodeTx.js';
import { connection, wss, DEFAULT_IMG } from './constants.js';

let tokens = {};

async function listenToWallets(wallet) {
    try {
        connection.onLogs(new PublicKey(wallet), async (logs, context) => {
            const signature = logs.signature
            console.log("SIG AT LISTENER:", signature)
            const tx = await getTx(signature)
            let tokenBalance = tx.tokenBalance
            let otherMint = tx.otherMint


            setHeldAmount(otherMint, tokenBalance)
            if (tokenBalance >= 3) {
                const logoData = await tokenLogo(otherMint)

                tokenBalance = tokenBalance / (10 ** (logoData?.decimals ?? 6));

                const totalTokenValue = await totalOwned(otherMint, tokenBalance);


                tokens[otherMint] = {
                    listToken: true,
                    tokenMint: otherMint,
                    tokenBalance,
                    usdValue: totalTokenValue || NaN,
                    logoURI: logoData?.logoURI || DEFAULT_IMG,
                    symbol: logoData?.symbol || "No ticker",
                };
                broadcastToClients(tokens[otherMint]);
            } else {

                delete tokens[otherMint];
                broadcastToClients({ tokenMint: otherMint, removed: true });

            }
            console.log(tx)
        }, "confirmed")


    } catch (err) {
        console.error('Error listening to wallets:', err);
    }
}

export function broadcastToClients(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

export async function refreshTokenPrices() {
    for (const mint in tokens) {
        const updatedValue = await totalOwned(mint, tokens[mint].tokenBalance);
        tokens[mint].usdValue = updatedValue;
        broadcastToClients(tokens[mint]);
    }
}
// setInterval(refreshTokenPrices, 30000);

export async function start(wallet) {
    try {
        // ourBalance = (await getOwnBalance()) * 1e6;

        await listenToWallets(wallet);
    } catch (error) {
        console.error('start error:', error.message);
    }
}


// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



/* export async function retrieveWalletStateWithTotal(wallet_address) {
    try {

        const data = await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${wallet_address}`);
        const tokenAcc = await data.json()
        console.log(tokenAcc)

        const mintsToFetch = Object.keys(tokenAcc).filter(key => key !== "SOL");

        const priceResponse = await fetch(`https://api.jup.ag/price/v2?ids=${mintsToFetch.join(',')}`);
        const priceData = await priceResponse.json();
        // console.log(priceData)

        const transformedResults = [];
        // console.log(priceData)

        for (const [key, info] of Object.entries(priceData.data)) {
            const mint = info.id;
            if (mint === solMint) continue;

            const price = parseFloat(info.price);

            const pricetotal = tokenAcc[mint].uiAmount * price;

            const tokenInfo = await tokenLogo(mint);

            // const totalTokenValue = await totalOwned(mint, tokenAcc[mint].uiAmount);


            let token = {
                tokenMint: mint,
                tokenBalance: tokenAcc[mint].uiAmount,
                usdValue: pricetotal,
                logoURI: tokenInfo?.logoURI || "No logo",
                symbol: tokenInfo?.symbol || "No ticker"
            };


            transformedResults.push(token);


        }

        console.log(transformedResults)




        broadcastToClients(transformedResults)
        return transformedResults;
    } catch (e) {
        console.error('bad wallet state:', e);
        throw e;
    }
} */

export { wss, tokens };
