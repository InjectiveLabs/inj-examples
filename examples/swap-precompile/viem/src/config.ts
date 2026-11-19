import { http, parseAbi, defineChain, createPublicClient } from 'viem'

export const RPC_URL =
  process.env.RPC_URL ?? 'https://k8s.testnet.json-rpc.injective.network/'
export const LCD_URL = (
  process.env.LCD_URL ?? 'https://k8s.testnet.lcd.injective.network'
).replace(/\/$/, '')
export const MARKET_ID =
  process.env.MARKET_ID ??
  '0x0f6ee483a7f7f633fe6e3f03d34e01e129b5a5023eb7b0fe1e8a56e5ac8779a6'
export const SWAP = '0x0000000000000000000000000000000000000068' as const
export const USDC_ADDRESS =
  '0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d' as const
export const USDC_DENOM = `erc20:${USDC_ADDRESS}`

export const chain = defineChain({
  id: 1439,
  name: 'Injective EVM Testnet',
  nativeCurrency: { name: 'Injective', symbol: 'INJ', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://testnet.blockscout.injective.network'
    }
  },
  testnet: true
})
export const client = createPublicClient({ chain, transport: http(RPC_URL) })
export const swapAbi = parseAbi([
  'function quoteExactInputV1(address tokenIn, string marketId, uint256 amountIn) view returns (uint256 amountOut)',
  'function quoteExactInputV2(address tokenIn, string marketId, uint256 amountIn) view returns (uint256 amountInSpent, uint256 amountOut)',
  'function swapExactInputV2(address tokenIn, string marketId, uint256 amountIn, uint256 minOut, address recipient, uint256 deadline) returns (uint256 amountInSpent, uint256 amountOut)'
])
export const tokenAbi = parseAbi([
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)'
])

export type Market = {
  ticker: string
  status: string
  market_id: string
  base_denom: string
  quote_denom: string
  min_notional: string
  base_decimals: number
  quote_decimals: number
  min_quantity_tick_size: string
}
export type SwapParams = { enabled: boolean; allowed_markets: string[] | null }
export type TokenPair = { bank_denom: string; erc20_address: string }

async function lcd<T>(path: string): Promise<T> {
  const url = `${LCD_URL}${path}`
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20_000)
  }).catch((cause: unknown) => {
    throw new Error(`Could not reach Injective LCD at ${url}`, { cause })
  })
  if (!response.ok)
    throw new Error(`LCD ${response.status} for ${url}: ${await response.text()}`)

  return (await response.json()) as T
}

export async function inspect() {
  if (!/^0x[0-9a-fA-F]{64}$/.test(MARKET_ID))
    throw new Error('MARKET_ID must be a 0x-prefixed 32-byte hash string')
  const [chainId, node, params, market, pair] = await Promise.all([
    client.getChainId(),
    lcd<{ default_node_info: { network: string } }>(
      '/cosmos/base/tendermint/v1beta1/node_info'
    ),
    lcd<{ params: { swap_params: SwapParams } }>(
      '/injective/exchange/v2/exchangeParams'
    ),
    lcd<{ market: null | Market }>(
      `/injective/exchange/v2/spot/markets/${MARKET_ID}`
    ),
    lcd<{ token_pair: null | TokenPair }>(
      `/injective/erc20/v1beta1/token_pair_by_denom?bank_denom=${encodeURIComponent(USDC_DENOM)}`
    )
  ])
  if (chainId !== 1439 || node.default_node_info.network !== 'injective-888') {
    throw new Error(
      'RPC and LCD must both target Injective testnet (1439 / injective-888)'
    )
  }

  return {
    chainId,
    nativeChainId: node.default_node_info.network,
    swap_params: params.params.swap_params,
    market: market.market,
    tokenPair: pair.token_pair
  }
}
