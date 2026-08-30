import { IndexerGrpcSpotApi, getDefaultSubaccountId } from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

const endpoints = getNetworkEndpoints(Network.Testnet);
const indexerSpotApi = new IndexerGrpcSpotApi(endpoints.indexer);

// Replace with your address
const injectiveAddress = 'YOUR_INJ_ADDRESS_HERE';
const marketId = '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe';
const subaccountId = getDefaultSubaccountId(injectiveAddress);


async function main() {
    await indexerSpotApi.fetchOrders({
        marketId,
        subaccountId: subaccountId,
    }).then(orders => {
        console.log('Active orders:', orders.orders);
        orders.orders.forEach(order => {
            console.log('Order:', {
                orderHash: order.orderHash,
                price: order.price,
                quantity: order.quantity,
                unfilledQuantity: order.unfilledQuantity,
                state: order.state
            });
        });
    });

    indexerSpotApi.fetchTrades({ marketId, subaccountId }).then(trades => {
        console.log('Recent trades:', trades.trades);
        trades.trades.forEach(trade => {
            console.log('Trade:', {
                price: trade.price,
                quantity: trade.quantity,
                fee: trade.fee,
                executedAt: trade.executedAt
            });
        });
    });


}

main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
