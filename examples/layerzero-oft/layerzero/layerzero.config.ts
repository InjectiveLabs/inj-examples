// Pathway config for the LayerZero oft-solana example: Injective testnet <-> Solana devnet.
// The Injective contract was deployed with Foundry, so it is referenced by address
// rather than by hardhat-deploy artifact. Replace OAPP_ADDRESS and the Solana address.
//
// DVNs: LayerZero Labs is the only verifier deployed on both Injective testnet and
// Solana devnet. On mainnet, Twinstake, Horizen and Canary are also on both chains,
// which allows a 2 of 3 or 3 of 4 configuration.
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'
import type { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

const injectiveContract: OmniPointHardhat = {
    eid: EndpointId.INJECTIVE1439_V2_TESTNET,
    address: process.env.OAPP_ADDRESS, // InjectiveOFTAdapter (Path A) or InjectiveOFT (Path B)
}

const solanaContract: OmniPointHardhat = {
    eid: EndpointId.SOLANA_V2_TESTNET, // 40168, Solana devnet
    address: process.env.SOLANA_OFT_STORE, // OFT Store from lz:oft:solana:create
}

const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    { msgType: 1, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 80000, value: 0 },
]

const SOLANA_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    { msgType: 1, optionType: ExecutorOptionType.LZ_RECEIVE, gas: 200000, value: 2500000 },
]

export default async function (): Promise<OAppOmniGraphHardhat> {
    const connections = await generateConnectionsConfig([
        [
            injectiveContract,
            solanaContract,
            [['LayerZero Labs'], []], // required DVNs, [optional DVNs, threshold]
            [1, 32], // confirmations: Injective -> Solana, Solana -> Injective
            [SOLANA_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
        ],
    ])

    return {
        contracts: [{ contract: injectiveContract }, { contract: solanaContract }],
        connections,
    }
}
