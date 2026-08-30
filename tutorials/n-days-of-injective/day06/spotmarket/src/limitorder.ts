import {
  MsgCreateSpotLimitOrder,
  spotPriceToChainPriceToFixed,
  getDefaultSubaccountId,
  spotQuantityToChainQuantityToFixed,
  spotPriceFromChainPriceToFixed,
} from '@injectivelabs/sdk-ts'
import { indexerSpotApi } from './fetch'

interface Market {
  marketId: string
  baseDecimals: number
  quoteDecimals: number
  priceTensMultiplier: number
  quantityTensMultiplier: number
}


export const makeMsgCreateSpotLimitOrder = (
  price: string,
  quantity: string,
  orderType: number,
  injectiveAddress: string,
  market: Market
) => {
  const subaccountId = getDefaultSubaccountId(injectiveAddress)

  return MsgCreateSpotLimitOrder.fromJSON({
    subaccountId,
    injectiveAddress,
    orderType,
    price: spotPriceToChainPriceToFixed({
      value: price,
      tensMultiplier: market.priceTensMultiplier,
      baseDecimals: market.baseDecimals,
      quoteDecimals: market.quoteDecimals,
    }),
    quantity: spotQuantityToChainQuantityToFixed({
      value: quantity,
      baseDecimals: market.baseDecimals,
    }),
    marketId: market.marketId,
    feeRecipient: injectiveAddress,
  })
}

export const getMarketPrice = async (marketId: string) => {
  try {
    // Fetch the orderbook for the market
    const orderbook = await indexerSpotApi.fetchOrderbookV2(marketId)
    
    // Get the best bid (highest buy price) and best ask (lowest sell price)
    const bestBid = orderbook.buys[0]?.price
    const bestAsk = orderbook.sells[0]?.price
    
    // Calculate mid-market price as average of best bid and ask
    let midPrice = '0'
    if (bestBid && bestAsk) {
      midPrice = ((parseFloat(bestBid) + parseFloat(bestAsk)) / 2).toString()
    } else if (bestBid) {
      midPrice = bestBid
    } else if (bestAsk) {
      midPrice = bestAsk
    }
    console.log('Best Bid:', bestBid)
    console.log('Best Ask:', bestAsk)
    console.log('Mid Price:', midPrice)

    return {
      bestBid: bestBid || '0',
      bestAsk: bestAsk || '0',
      midPrice,
      spread: bestBid && bestAsk ? (parseFloat(bestAsk) - parseFloat(bestBid)).toString() : '0'
    }
  } catch (error) {
    console.error('Error fetching market price:', error)
    throw error
  }
}

export const convertChainPriceToPrice = (
  chainPrice: string,
  baseDecimals: number,
  quoteDecimals: number,
) => {
  return spotPriceFromChainPriceToFixed({
    value: chainPrice,
    baseDecimals,
    quoteDecimals,
  })
}
