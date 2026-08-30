import { makeMsgCreateSpotLimitOrder, getMarketPrice, convertChainPriceToPrice } from "./limitorder"
import { MsgBroadcasterWithPk } from '@injectivelabs/sdk-ts';
import { Network } from '@injectivelabs/networks'
import * as dotenv from 'dotenv';

async function main() {
    const result = await getMarketPrice('0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe');
    const bestBid = convertChainPriceToPrice(result.bestBid, 18, 6);
    const bestAsk = convertChainPriceToPrice(result.bestAsk, 18, 6);
    const multiplier = 1.5;   // we over ask for sell orders to ensure buy execution later
    console.log('Market Mid Price Result:', convertChainPriceToPrice(result.midPrice, 18, 6));

    dotenv.config();
    // ----- Config / env -----
    const PRIVATE = process.env.PRIVATE || '<YOUR_PRIVATE_KEY>';
    const INJECTIVE_ADDRESS = process.env.INJECTIVE_ADDRESS || '<YOUR_INJECTIVE_ADDRESS>';
    // ------------------------
    console.log('From address:', INJECTIVE_ADDRESS);

    const placeOrderMsg = makeMsgCreateSpotLimitOrder(
        (bestAsk * multiplier).toString(),  // price of the asset
        "0.1",    // how much to buy/sell
        1,    // orderType (1 for Buy, 2 for Sell)
        INJECTIVE_ADDRESS,
        {
            marketId: '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe', // Example marketId
            baseDecimals: 18,
            quoteDecimals: 6,
            priceTensMultiplier: -3, 
            quantityTensMultiplier:-3, 
        },
    );
    console.log('Place Order Msg:', placeOrderMsg);
    const txHash = await new MsgBroadcasterWithPk({
        privateKey: PRIVATE,
        network: Network.TestnetK8s,
    }).broadcast({
        msgs: [placeOrderMsg]
    });
    console.log('Transaction result:', txHash);

}

main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
});