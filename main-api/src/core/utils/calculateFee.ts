export function calculateFee(fee: number, unitLimit: number) {
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const MICROLAMPORTS_PER_LAMPORT = 1_000_000;

  const totalLamports = fee * LAMPORTS_PER_SOL;
  const totalMicroLamports = totalLamports * MICROLAMPORTS_PER_LAMPORT;
  let microLamportsPerUnit = Math.floor(totalMicroLamports / unitLimit);

  if (microLamportsPerUnit < 1) {
    microLamportsPerUnit = 1;
  }

  return microLamportsPerUnit;
}
