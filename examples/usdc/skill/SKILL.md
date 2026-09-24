---
name: cctp-injective
description: >
  Use Circle's Cross-Chain Transfer Protocol (CCTP) v2 to burn and mint native USDC between
  Injective EVM Testnet and Ethereum Sepolia. Use when building dApps, scripts, or agents that
  need to transfer USDC across these chains. Covers: how to look up contract addresses from
  official docs, depositForBurn parameters (critical minFinalityThreshold and maxFee values),
  Circle Iris API attestation polling, and receiveMessage on the destination chain. Handles both
  directions: Injective→Sepolia and Sepolia→Injective. Includes common failure modes
  (insufficient_fee, long finality waits).
---

# CCTP on Injective — Developer Guide

Circle's CCTP v2 lets you burn native USDC on one chain and mint it on another.
The flow is always: **Approve → depositForBurn → poll Iris API → receiveMessage**.

## Contract Addresses

**Do not hardcode addresses.** Always look them up from the authoritative sources:

- **Injective CCTP contracts**: https://docs.injective.network/developers-defi/usdc-stablecoin
- **Circle CCTP contracts (all chains)**: https://developers.circle.com/cctp/references/contract-addresses
- **Circle CCTP domain IDs**: https://developers.circle.com/cctp/references/supported-domains

Key facts to know when fetching:
- TokenMessengerV2 and MessageTransmitterV2 are deployed at the **same address on all chains** via CREATE2
- Injective EVM Testnet CCTP domain ID: verify from Circle's supported-domains page
- Ethereum Sepolia CCTP domain ID: `0` (stable, unlikely to change)
- USDC addresses differ per chain — always fetch from the chain-specific docs above

## Step 1 — Approve + depositForBurn

```ts
import { parseUnits, padHex } from 'viem'

// 1. Approve TokenMessengerV2 to spend USDC on the source chain
await approve(TOKEN_MESSENGER_V2, amount)

// 2. Burn USDC and emit a cross-chain message
await tokenMessenger.depositForBurn(
  amount,                          // uint256 — parseUnits('1.0', 6)
  destinationDomain,               // uint32  — look up from Circle docs
  padHex(recipient, { size: 32 }), // bytes32 — recipient on destination chain
  sourceUSDC,                      // address — USDC on source chain
  '0x000...000',                   // bytes32 — destinationCaller (0 = anyone can relay)
  maxFee,                          // uint256 — ⚠️ see critical note below
  minFinalityThreshold             // uint32  — ⚠️ see critical note below
)
```

### ⚠️ Critical: minFinalityThreshold + maxFee interaction

This is the most common source of bugs:

| Source chain | minFinalityThreshold | maxFee | Result |
|---|---|---|---|
| Injective | `2000` (Standard) | `0n` | ✅ Standard Transfer, ~0.65 s |
| Sepolia | `2000` (Standard) | `0n` | ✅ Standard Transfer, ~15–19 min |
| Sepolia | `≤1000` (Fast) | sufficient | ✅ Fast Transfer, ~20 s |
| Sepolia | `≤1000` (Fast) | `0n` or too low | ⚠️ Degraded to Standard Transfer, ~15–19 min |

**Rule**: fast finality (`minFinalityThreshold ≤ 1000`) requires `maxFee ≥ route fee` to stay in fast mode. If `maxFee` is too low, Circle degrades to Standard Transfer — the tx still completes, just slower.

Always query the fee API before setting `maxFee`:
```
GET https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/{sourceDomain}/{destDomain}
```
See: https://developers.circle.com/cctp/concepts/fees

Recommended values:

```ts
// Injective → Sepolia
const minFinalityThreshold = 2000   // FINALIZED, free
const maxFee = 0n

// Sepolia → Injective (fast, small relay fee)
const minFinalityThreshold = 1
const maxFee = 1000n   // 0.001 USDC — deducted from minted amount on destination
```

## Step 2 — Poll Circle Iris API (Sandbox)

```ts
// sourceDomain = CCTP domain of the chain where depositForBurn was called
// Look up from: https://developers.circle.com/cctp/references/supported-domains
const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${burnTxHash}`
const { messages } = await fetch(url).then(r => r.json())

// messages[0].status:
//   "pending_confirmations" → still waiting, poll again in 15s
//   "complete"              → ready to mint
//
// Always check messages[0].delayReason — if "insufficient_fee", the tx is stuck forever.
// messages[0].message      → bytes to pass to receiveMessage
// messages[0].attestation  → signature to pass to receiveMessage
```

Poll every 15 seconds until `status === 'complete'`.

## Step 3 — receiveMessage on destination

```ts
// Call on the DESTINATION chain's MessageTransmitterV2
// Address: fetch from https://developers.circle.com/cctp/references/contract-addresses
await messageTransmitter.receiveMessage(
  messages[0].message,      // bytes
  messages[0].attestation   // bytes
)
```

## Common Failures

See [references/troubleshooting.md](references/troubleshooting.md) for full details.

| Symptom | Cause | Fix |
|---|---|---|
| `delayReason: "insufficient_fee"` | Fast mode (`≤1000`) with `maxFee` below route fee | Tx completes as Standard (~15–19 min). Next time query fee API and set sufficient `maxFee` |
| Waiting >15 min, `delayReason: null` | `minFinalityThreshold=2000` on ETH source (Standard Transfer, expected) | Use Fast Transfer (`≤1000`) + sufficient `maxFee` next time |
| `status` stuck at `pending_confirmations` | Finality wait or degraded to Standard | Check `delayReason` — if `insufficient_fee`, just wait it out (~15–19 min total) |

## Networks

```
Injective EVM Testnet
  Chain ID : 1439
  RPC      : https://sentry.json-rpc.testnet.injective.network/
  Explorer : https://testnet.blockscout.injective.network
  Docs     : https://docs.injective.network/developers-evm

Ethereum Sepolia
  Chain ID : 11155111
  RPC      : https://rpc.sepolia.org (or any public Sepolia RPC)
  Explorer : https://sepolia.etherscan.io
```
