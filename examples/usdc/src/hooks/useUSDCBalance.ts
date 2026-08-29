import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { CONTRACTS, SEPOLIA_CONTRACTS, injectiveEVMTestnet } from '../wagmi'
import { sepolia } from 'wagmi/chains'
import { erc20Abi } from '../abis/erc20'

export type TransferDirection = 'inj→sep' | 'sep→inj'

/**
 * Returns USDC balance for the given direction's source chain.
 * inj→sep: reads from Injective EVM Testnet
 * sep→inj: reads from Ethereum Sepolia
 */
export function useUSDCBalance(address?: `0x${string}`, direction: TransferDirection = 'inj→sep') {
  const usdcAddress = direction === 'sep→inj' ? SEPOLIA_CONTRACTS.USDC : CONTRACTS.USDC
  const chainId = direction === 'sep→inj' ? sepolia.id : injectiveEVMTestnet.id

  const { data, isLoading, isError, refetch } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const formatted = data !== undefined
    ? Number(formatUnits(data, 6)).toFixed(2)
    : null

  return { raw: data, formatted, isLoading, isError, refetch }
}

/**
 * Returns USDC allowance for the given direction's source chain.
 */
export function useUSDCAllowance(
  owner?: `0x${string}`,
  spender?: `0x${string}`,
  direction: TransferDirection = 'inj→sep',
) {
  const usdcAddress = direction === 'sep→inj' ? SEPOLIA_CONTRACTS.USDC : CONTRACTS.USDC
  const chainId = direction === 'sep→inj' ? sepolia.id : injectiveEVMTestnet.id

  const { data, isLoading, refetch } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    chainId,
    query: { enabled: !!owner && !!spender, refetchInterval: 5_000 },
  })

  return { allowance: data, isLoading, refetch }
}
