import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

/**
 * Injective EVM Testnet
 * Chain ID: 1439 | RPC: https://k8s.testnet.json-rpc.injective.network/
 * Source: https://docs.injective.network/developers-evm/network-information
 */
export const injectiveTestnet = defineChain({
  id: 1439,
  name: "Injective Testnet",
  nativeCurrency: {
    name: "Injective",
    symbol: "INJ",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_RPC_URL || "https://k8s.testnet.json-rpc.injective.network/",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Injective Testnet Explorer",
      url: import.meta.env.VITE_EXPLORER_URL || "https://testnet.blockscout.injective.network/",
    },
  },
  testnet: true,
});


export const wagmiConfig = createConfig({
  chains: [injectiveTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
    }),
  ],
  transports: {
    [injectiveTestnet.id]: http(),
  },
});
