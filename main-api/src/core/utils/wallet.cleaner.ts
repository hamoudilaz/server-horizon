import { PublicKey, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferCheckedInstruction, createCloseAccountInstruction } from '@solana/spl-token';
import { connection } from '../../services/solana/panel.js';
import { getSolPriceFromRedis } from '../../services/redis/trackedTokens.js';

export async function cleanupWallet(walletKeyPair: Keypair) {
  try {
    const rentLamports = await connection.getMinimumBalanceForRentExemption(165);
    const rentSol = rentLamports / 1e9;

    const parsed = await connection.getParsedTokenAccountsByOwner(walletKeyPair.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    if (!parsed.value.length) {
      return { error: 'No token accounts found.' };
    }

    let totalReclaimed = 0;
    let cleanedCount = 0;

    for (const { pubkey, account } of parsed.value) {
      const info = account.data.parsed.info;
      const mint = new PublicKey(info.mint);
      const decimals = info.tokenAmount.decimals ?? 0;
      const rawAmount = BigInt(info.tokenAmount.amount ?? '0');

      // Skip valuable accounts
      if (rawAmount > 1_0000n) continue;

      // Find a valid existing holder ATA
      const largest = await connection.getTokenLargestAccounts(mint);
      const first = largest.value.find((a) => a.amount !== '0');
      if (!first) continue;
      const dest = new PublicKey(first.address);

      const tx = new Transaction();
      if (rawAmount > 0n) {
        tx.add(
          createTransferCheckedInstruction(pubkey, mint, dest, walletKeyPair.publicKey, Number(rawAmount), decimals)
        );
      }

      tx.add(createCloseAccountInstruction(pubkey, walletKeyPair.publicKey, walletKeyPair.publicKey));

      await sendAndConfirmTransaction(connection, tx, [walletKeyPair]);
      cleanedCount++;
      totalReclaimed += rentSol;
    }

    const solPrice = (await getSolPriceFromRedis()) ?? 150; // fallback if null
    const totalUsd = Number((totalReclaimed * solPrice).toFixed(2));

    if (cleanedCount === 0) return { error: 'No eligible dust accounts for cleanup.' };

    return {
      cleanedCount,
      totalReclaimed: Number(totalReclaimed.toFixed(6)),
      totalUsd,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
