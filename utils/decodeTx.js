import { connection, pubKey, getBalance } from "../panel.js";

export default async function getTx(sig) {
    const tx = await connection.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0
    })
    if (!tx) return { error: "No tx" }
    const decoded = await decodeTx(tx, pubKey)
    return decoded
}



async function decodeTx(transaction, owner) {
    const SOL_MINT = "So11111111111111111111111111111111111111112";

    if (!transaction?.meta.preTokenBalances?.length || !transaction?.meta.preBalances?.length) {
        return { error: "preTokenBalances missing" };
    }


    const preBalances = {};
    transaction.meta.preTokenBalances.forEach((token) => {
        if (token.owner === owner) {
            const mint = token.mint;
            const amount = BigInt(token.uiTokenAmount.amount);
            preBalances[mint] = (preBalances[mint] || 0n) + amount;
        }
    });
    const postBalances = {};
    transaction.meta.postTokenBalances.forEach((token) => {
        if (token.owner === owner) {
            const mint = token.mint;
            const amount = BigInt(token.uiTokenAmount.amount);
            postBalances[mint] = (postBalances[mint] || 0n) + amount;
        }
    });


    const allMints = new Set([...Object.keys(preBalances), ...Object.keys(postBalances)]);
    let inputMint = null,
        outputMint = null;
    let inputAmount = 0n,
        outputAmount = 0n;
    allMints.forEach((mint) => {
        const pre = preBalances[mint] || 0n;
        const post = postBalances[mint] || 0n;
        const diff = post - pre;
        if (diff < 0n) {
            inputMint = mint;
            inputAmount = -diff;
        } else if (diff > 0n) {
            outputMint = mint;
            outputAmount = diff;
        }
    });

    const preSOL = BigInt(transaction.meta.preBalances[0]);
    const postSOL = BigInt(transaction.meta.postBalances[0]);
    const fee = BigInt(transaction.meta.fee);
    let solInput = 0n,
        solOutput = 0n;
    if (postSOL < preSOL) {
        const netSpent = preSOL - postSOL;
        if (netSpent > fee) {
            solInput = netSpent - fee;
        }
    } else if (postSOL > preSOL) {
        solOutput = postSOL - preSOL + fee;
    }
    if (!inputMint && solInput > 0n) {
        inputMint = SOL_MINT;
        inputAmount = solInput;
    }
    if (!outputMint && solOutput > 0n) {
        outputMint = SOL_MINT;
        outputAmount = solOutput;
    }
    const type = inputMint === SOL_MINT ? 'buy' : 'sell';


    if (type === "buy") {
        return {
            otherMint: outputMint,
            tokenBalance: await getBalance(outputMint)
        }
    } else {
        return {
            otherMint: inputMint,
            tokenBalance: await getBalance(inputMint)
        };
    }
}







