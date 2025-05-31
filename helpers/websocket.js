import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { getOwnBalance, totalOwned, tokenLogo } from '../helpers/helper.js';
import { solMint } from '../helpers/constants.js';
import WebSocket from 'ws';


let wss;

export function setupWebSocket(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Frontend WebSocket client connected');

        ws.on('close', () => {
            console.log('Frontend WebSocket client disconnected');
        });

        ws.on('message', (message) => {
            console.log('Received from frontend:', message);
        });
    });
}


const connection = new Connection(process.env.RPC_URL, {
    wsEndpoint: process.env.WSS_SHYFT,
    commitment: 'confirmed',
});

let otherMint;
let ourBalance;
let tokenBalance;
let tokens = {};

async function listenToWallets(wallet) {
    try {
        connection.onProgramAccountChange(
            TOKEN_PROGRAM_ID,
            async (data) => {
                const changedMint = AccountLayout.decode(data.accountInfo.data).mint.toBase58();
                const amount = AccountLayout.decode(data.accountInfo.data).amount;
                const balance = Number(amount);

                if (changedMint === solMint) {

                    ourBalance = balance.toFixed(2);

                } else {
                    otherMint = changedMint;
                    tokenBalance = balance.toFixed(5);
                    if (tokenBalance >= 3) {
                        const logoData = await tokenLogo(otherMint)
                        tokenBalance = tokenBalance / (10 ** (logoData?.decimals ?? 6));


                        const totalTokenValue = await totalOwned(otherMint, tokenBalance);
                        tokens[otherMint] = {
                            listToken: true,
                            tokenMint: otherMint,
                            tokenBalance,
                            usdValue: totalTokenValue || NaN,
                            logoURI: logoData?.logoURI || "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
                            symbol: logoData?.symbol || "No ticker",
                        };
                        broadcastToClients(tokens[otherMint]);
                    } else {
                        delete tokens[otherMint];
                        broadcastToClients({ tokenMint: otherMint, removed: true });
                    }
                }
            },
            {
                commitment: 'processed',
                filters: [
                    {
                        dataSize: 165,
                    },
                    {
                        memcmp: {
                            offset: 32,
                            bytes: wallet,
                        },
                    },
                ],
            }
        );
    } catch (err) {
        console.error('Error listening to wallets:', err);
    }
}

function broadcastToClients(data) {
    console.log("BROADCASTING TO FRONTEND:", data)
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
        ourBalance = (await getOwnBalance()) * 1e6;

        await listenToWallets(wallet);
    } catch (error) {
        console.error('start error:', error.message);
    }
}



export { tokens };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



export async function retrieveWalletStateWithTotal(wallet_address) {
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
}

export { wss };
