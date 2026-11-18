import { CIRCLE_API } from './wagmi'

export async function fetchFastFee(sourceDomain: number, destinationDomain: number, signal?: AbortSignal) {
  const response = await fetch(`${CIRCLE_API}/burn/USDC/fees/${sourceDomain}/${destinationDomain}`, { signal })
  if (!response.ok) throw new Error(`Circle fee API returned HTTP ${response.status}`)

  const fees: { finalityThreshold: number; minimumFee: number }[] = await response.json()
  const rate = fees.find(fee => fee.finalityThreshold === 1000)?.minimumFee
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate >= 10_000) {
    throw new Error('Circle did not return a valid Fast Transfer fee for this route')
  }
  return rate
}

export function bufferedFastFee(amount: bigint, basisPoints: number) {
  // Keep hundredths of a basis point and round up after adding a 20% buffer.
  const rate = BigInt(Math.ceil(basisPoints * 100))
  const denominator = 100_000_000n
  return (amount * rate * 120n + denominator - 1n) / denominator
}
