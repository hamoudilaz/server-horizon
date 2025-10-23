import bs58 from 'bs58';

export function validateKey(key: string): boolean {
  try {
    const decoded = bs58.decode(key);

    // Solana private keys are typically 64 bytes long, but they can also be 32 bytes (seed phrase keys)
    if (decoded.length === 64 || decoded.length === 32) {
      return true;
    }

    return false;
  } catch (error) {
    // If decoding fails, the key is invalid
    return false;
  }
}
