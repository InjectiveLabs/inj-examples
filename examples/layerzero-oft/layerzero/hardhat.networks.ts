// Drop these entries into the `networks` block of hardhat.config.ts in the
// LayerZero oft-solana example. `eid` is what the LayerZero tooling keys on.
// Do not use EndpointId.INJECTIVE_V2_TESTNET (40218): that is the retired inEVM testnet.
import { EndpointId } from '@layerzerolabs/lz-definitions'

export const injectiveNetworks = {
    'injective-testnet': {
        eid: EndpointId.INJECTIVE1439_V2_TESTNET, // 40408, chain id 1439
        url: process.env.RPC_URL_INJECTIVE_TESTNET || 'https://k8s.testnet.json-rpc.injective.network/',
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    'injective-mainnet': {
        eid: EndpointId.INJECTIVEEVM_V2_MAINNET, // 30394, chain id 1776
        url: process.env.RPC_URL_INJECTIVE_MAINNET || 'https://sentry.evm-rpc.injective.network/',
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
}
