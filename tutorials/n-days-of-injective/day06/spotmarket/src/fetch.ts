/* day06/SpotMarket/src/fetch.ts

Fetch spot market data and wallet balances using Injective SDK

*/
import {
  ChainGrpcBankApi,
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
  type SpotMarket,
  getSpotMarketTensMultiplier
} from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'

// Using testnet
export const NETWORK = Network.Testnet
export const ENDPOINTS = getNetworkEndpoints(NETWORK)

// Initialize API clients
export const chainBankApi = new ChainGrpcBankApi(ENDPOINTS.grpc)
export const indexerSpotApi = new IndexerGrpcSpotApi(ENDPOINTS.indexer)
export const indexerDerivativesApi = new IndexerGrpcDerivativesApi(ENDPOINTS.indexer)

// Fetch wallet balances
export const fetchBalances = async (injectiveAddress: string) => {
  try {
    console.log('Fetching balances for address:', injectiveAddress)
    console.log('Using endpoints:', ENDPOINTS)
    const result = await chainBankApi.fetchBalances(injectiveAddress)
    console.log('Balance result:', result)
    return result
  } catch (error) {
    console.error('Error fetching balances:', error)
    throw error
  }
}

// Market details interface definition
interface MarketDetails {
  marketId: string      // Unique market identifier
  ticker: string        // Trading pair identifier, e.g. "INJ/USDT"
  baseDenom: string     // Base token's on-chain identifier
  quoteDenom: string    // Quote token's on-chain identifier
  baseSymbol: string    // Base token symbol, e.g. "INJ"
  quoteSymbol: string   // Quote token symbol, e.g. "USDT"
  baseDecimals: number  // Base token decimal places
  quoteDecimals: number // Quote token decimal places
  minPriceTickSize: string    // Minimum price movement unit
  minQuantityTickSize: string // Minimum quantity movement unit
  status: string        // Market status (e.g. active, inactive)
  priceTensMultiplier: string // Price precision adjustment multiplier
  quantityTensMultiplier: string // Quantity precision adjustment multiplier
}

// Fetch and process market list
export const fetchMarketsWithDetails = async (): Promise<MarketDetails[]> => {
  try {
    const spot = await indexerSpotApi.fetchMarkets()
    
    // Only get basic info for first 5 markets
    const marketsWithSymbols = spot.slice(0, 5).map((market: SpotMarket) => {
      // Split ticker to get base and quote token symbols
      const [baseSymbol, quoteSymbol] = market.ticker.split('/')
      
      // Get token decimals, use defaults if undefined
      const baseDecimals = market.baseToken?.decimals || 18
      const quoteDecimals = market.quoteToken?.decimals || 6
      
      // Get market tens multiplier for price and quantity precision adjustment
      const { priceTensMultiplier, quantityTensMultiplier } = getSpotMarketTensMultiplier({
        minPriceTickSize: market.minPriceTickSize,
        minQuantityTickSize: market.minQuantityTickSize,
        baseDecimals,
        quoteDecimals,
      })
      return {
        marketId: market.marketId,
        ticker: market.ticker,
        baseDenom: market.baseDenom,
        quoteDenom: market.quoteDenom,
        baseSymbol,
        quoteSymbol,
        baseDecimals,
        quoteDecimals,
        minPriceTickSize: market.minPriceTickSize.toString(),
        minQuantityTickSize: market.minQuantityTickSize.toString(),
        status: market.marketStatus,
        priceTensMultiplier: priceTensMultiplier.toString(),
        quantityTensMultiplier: quantityTensMultiplier.toString(),
      }
    })
    return marketsWithSymbols
  } catch (error) {
    console.error('Error loading markets:', error)
    throw error
  }
}

async function main() {
    fetchMarketsWithDetails().then((markets) => {
      console.log(JSON.stringify(markets, null, 2))
    })
    const market = await indexerSpotApi.fetchMarket('0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe')
console.log('Min notional of INJ/USDT market:', market.minNotional)
}
main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
});