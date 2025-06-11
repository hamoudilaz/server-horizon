import { tokenLogo, totalOwned, getTokenPriceFallback } from "../../helpers/helper.js"
import { wss } from "../../helpers/websocket.js";
import { setDemoAmount, sessions } from "../globals.js";

let tokens = {}
export async function simulateBuy(session, outputMint, lamports) {
    try {
        const logoData = await tokenLogo(outputMint);
        const decimals = logoData?.decimals ?? 6;

        const price = await getTokenPriceFallback(outputMint);
        if (!price) throw new Error('Failed to fetch token price');

        const newTokenAmount = lamports / (10 ** decimals);
        const prevTokenAmount = tokens[outputMint]?.tokenBalance || 0;
        const tokenAmount = prevTokenAmount + newTokenAmount;

        const totalUSD = tokenAmount * price;

        const data = sessions.get(session);
        if (data) {
            data.currentUsd -= totalUSD;
            sessions.set(session, data);
        }
        setDemoAmount(session, outputMint, newTokenAmount);

        tokens[outputMint] = {
            simulation: true,
            tokenMint: outputMint,
            tokenBalance: tokenAmount,
            usdValue: totalUSD,
            logoURI: logoData?.logoURI || DEFAULT_IMG,
            symbol: logoData?.symbol || 'No ticker',
        };



        broadcastToClients(tokens[outputMint]);
        return { result: "3ExTVArpHV5Sybwf5jsjEMjataf6kksgLXZAqPgyaPdLsXMwKN3V3sSs8DrVVeTXNMTWf3RFzwVi3PW9dVJ9hpzf" }

    } catch (err) {
        console.error("Simulation Error:", err)
        return err
    }
}


export async function simulateSell(session, mint, totalOwned, sellPercentage) {
    try {
        const logoData = await tokenLogo(mint);

        const soldAmount = totalOwned * (sellPercentage / 100);
        const remaining = totalOwned - soldAmount;

        const decimals = logoData?.decimals ?? 6;
        const tokenAmount = remaining / (10 ** decimals); // decode


        if (sellPercentage === 100 || remaining <= 0) {
            delete tokens[mint];
            setDemoAmount(session, mint, -totalOwned);
            broadcastToClients({ tokenMint: mint, removed: true });
        } else {
            setDemoAmount(session, mint, -soldAmount);
            const price = await getTokenPriceFallback(mint);
            const totalUSD = tokenAmount * price;

            const data = sessions.get(session);
            if (data) {
                data.currentUsd += totalUSD;
                sessions.set(session, data);
            }

            tokens[mint] = {
                simulation: true,
                tokenMint: mint,
                tokenBalance: tokenAmount,
                usdValue: totalUSD,
                logoURI: logoData?.logoURI || DEFAULT_IMG,
                symbol: logoData?.symbol || 'No ticker',
            };

            broadcastToClients(tokens[mint]);
        }

        return { result: "SIMULATED_" + Date.now() };
    } catch (err) {
        console.error("Simulation Error:", err);
        return err;
    }
}


function broadcastToClients(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}


export const demoFetchTokens = async (request, reply) => {
    reply.send(Object.values(tokens));
}