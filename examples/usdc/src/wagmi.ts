import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Injective EVM Testnet chain definition
// Reference: https://docs.injective.network/developers-evm/network-information#injective-evm-testnet
export const injectiveEVMTestnet = {
  id: 1439,
  name: 'Injective EVM Testnet',
  nativeCurrency: { decimals: 18, name: 'Injective', symbol: 'INJ' },
  rpcUrls: {
    default: { http: ['https://sentry.json-rpc.testnet.injective.network/'] },
    public:  { http: ['https://sentry.json-rpc.testnet.injective.network/'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://testnet.blockscout.injective.network',
    },
  },
  testnet: true,
} as const

// ─── Source chain contracts (Injective EVM Testnet) ──────────────────────────
export const CONTRACTS = {
  USDC:                '0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d' as `0x${string}`,
  TOKEN_MESSENGER_V2:  '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
  MESSAGE_TRANSMITTER_V2: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
} as const

// ─── Ethereum Sepolia contracts ───────────────────────────────────────────────
// CCTP v2 contracts are deployed at the same address across all chains via CREATE2.
export const SEPOLIA_CONTRACTS = {
  // Same address as on Injective — CREATE2 deployment
  TOKEN_MESSENGER_V2:     '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
  MESSAGE_TRANSMITTER_V2: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
  // Official Circle testnet USDC on Sepolia
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
} as const

// ─── CCTP domain IDs ─────────────────────────────────────────────────────────
// Injective CCTP domain (source or destination)
export const INJECTIVE_DOMAIN = 29
/** @deprecated Use INJECTIVE_DOMAIN */
export const INJECTIVE_SOURCE_DOMAIN = INJECTIVE_DOMAIN

// Ethereum Sepolia CCTP domain (source or destination)
export const SEPOLIA_DOMAIN = 0
/** @deprecated Use SEPOLIA_DOMAIN */
export const SEPOLIA_DESTINATION_DOMAIN = SEPOLIA_DOMAIN

// Circle Attestation API (sandbox)
export const CIRCLE_ATTESTATION_API = 'https://iris-api-sandbox.circle.com/v2/messages'

// ─── Wagmi config ─────────────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: [injectiveEVMTestnet, sepolia],
  connectors: [
    // Use injected() to directly interface with MetaMask browser extension (window.ethereum)
    // This triggers the native MetaMask popup immediately on click
    injected({ target: 'metaMask' }),
  ],
  transports: {
    [injectiveEVMTestnet.id]: http('https://sentry.json-rpc.testnet.injective.network/'),
    [sepolia.id]: http(),
  },
})
