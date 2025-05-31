import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();



const connection = new Connection(process.env.RPC_URL, 'processed');

let wallet = null

let pubKey = null

console.log(pubKey)

function loadKey(key) {
    try {
        if (!key) throw new Error('Key is undefined or empty');

        wallet = Keypair.fromSecretKey(bs58.decode(key));
        if (!wallet) throw new Error('Failed to generate wallet');

        pubKey = wallet.publicKey.toBase58();
        console.log('Your PublicKey: ' + pubKey);

        return pubKey;
    } catch (error) {
        console.error('loadKey error:', error.message);
        return null;
    }
}



async function getBalance(mint, maxRetries = 5, delayMs = 300) {
    if (!wallet.publicKey) {
        console.error('Wallet is not loaded');
        return 0;
    }

    for (let i = 0; i < maxRetries; i++) {
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
                mint: new PublicKey(mint),
            });

            if (tokenAccounts.value?.length) {
                const raw = Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount);
                if (raw > 0) return Math.floor(raw);
            }
        } catch (err) {
            console.error("Balance fetch error:", err.message);
        }

        await new Promise(res => setTimeout(res, delayMs));
    }

    return 0;
}


export { wallet, pubKey, getBalance, loadKey, connection };
