# CCTP Contract Address Sources

Do not hardcode contract addresses. Always fetch from the authoritative sources below.
Addresses can be updated, and the canonical sources are always current.

## Official Sources

| What | URL |
|---|---|
| **Injective USDC + CCTP contracts** | https://docs.injective.network/developers-defi/usdc-stablecoin |
| **Circle CCTP all-chain contract addresses** | https://developers.circle.com/cctp/references/contract-addresses |
| **Circle CCTP domain IDs** | https://developers.circle.com/cctp/references/supported-domains |
| **Circle Iris API reference** | https://developers.circle.com/cctp/reference/getmessages |

## How to Look Up

1. **Injective contracts** (USDC, TokenMessengerV2, MessageTransmitterV2):
   → Go to https://docs.injective.network/developers-defi/usdc-stablecoin
   → Find the "EVM Testnet" or "EVM Mainnet" section

2. **Sepolia and other EVM chains** (USDC, TokenMessengerV2, MessageTransmitterV2):
   → Go to https://developers.circle.com/cctp/references/contract-addresses
   → Select "Testnet" tab for testnets

3. **CCTP domain IDs** (needed for depositForBurn and Iris API polling):
   → Go to https://developers.circle.com/cctp/references/supported-domains
   → Look up by chain name

## Structural Facts (stable, safe to use without re-checking)

- TokenMessengerV2 and MessageTransmitterV2 are deployed at the **same address across all CCTP v2 chains** via CREATE2 — so one lookup covers both chains
- Ethereum's CCTP domain ID is `0` on all networks (mainnet and testnets)
- USDC uses **6 decimal places** on all EVM chains
- Circle Iris API sandbox: `https://iris-api-sandbox.circle.com/v2/messages/{sourceDomain}`
- Circle Iris API production: `https://iris-api.circle.com/v2/messages/{sourceDomain}`
