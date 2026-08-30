import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Injective EVM Testnet — Chain ID: 1439
    // RPC: https://k8s.testnet.json-rpc.injective.network/
    injectiveTestnet: {
      url: process.env.INJECTIVE_TESTNET_RPC || "https://k8s.testnet.json-rpc.injective.network/",
      chainId: 1439,
      accounts: [PRIVATE_KEY],
      gasPrice: 160000000, // 0.16 Gwei — Injective EVM minimum
      gas: 2000000,
    },
  },
  etherscan: {
    apiKey: {
      injectiveTestnet: "placeholder",
    },
    customChains: [
      {
        network: "injectiveTestnet",
        chainId: 1439,
        urls: {
          apiURL: "https://testnet.blockscout-api.injective.network/api",
          browserURL: "https://testnet.blockscout.injective.network",
        },
      },
    ],
  },
};

export default config;
