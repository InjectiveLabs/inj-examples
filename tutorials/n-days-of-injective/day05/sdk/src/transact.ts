// src/transact.ts
/**
 * Simple example: sign and send INJ using @injectivelabs/sdk-ts
 *
 * Usage:
 * 1) Set environment variables (recommended):
 *    - PRIVATE : the wallet private key for the sender
 *    - SENDER   : sender address (e.g. inj1...)
 *    - RECEIVER : recipient address (e.g. inj1...)
 *    - AMOUNT   : amount of INJ to send (string, whole units like "1" for 1 INJ)
 *
 * 2) Run:
 *    npm ts-node src/transact.ts
 *
 *
 * NOTE:
 * - Ensure tsconfig.json has "esModuleInterop": true and "moduleResolution": "node".
 * - Adjust endpoints, chain-id and fee/gas to match your environment (testnet / mainnet).
 */

import { MsgSend, MsgBroadcasterWithPk } from '@injectivelabs/sdk-ts';
import { Network } from '@injectivelabs/networks'
import * as dotenv from 'dotenv';

async function main() {
    dotenv.config();
    // ----- Config / env -----
    const PRIAVTE = process.env.PRIVATE || '<YOUR_PRIVATE_KEY>';
    const RECEIVER = process.env.RECEIVER || '<RECEIVER_ADDRESS_HERE>';
    const AMOUNT = process.env.AMOUNT || '1000'; 
    const SENDER = process.env.SENDER || '<SENDER_ADDRESS_HERE>';
    // ------------------------
    const MEMO = 'Send INJ via SDK example';
    console.log('From address:', SENDER);
    console.log('Sending', AMOUNT, 'inj to', RECEIVER);
    const txHash = await new MsgBroadcasterWithPk({
        privateKey: PRIAVTE,
        network: Network.TestnetK8s,
    }).broadcast({
        msgs: MsgSend.fromJSON({
            srcInjectiveAddress: SENDER,
            dstInjectiveAddress: RECEIVER,
            amount: {
                amount: AMOUNT,
                denom: 'inj',
            },
        }),
    });
    console.log('Transaction result:', txHash);

}

main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
