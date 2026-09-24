# USDC CCTP Demo — Injective EVM Testnet ↔ Ethereum Sepolia

> A developer education dApp demonstrating how to use Circle's Cross-Chain Transfer Protocol (CCTP) to move USDC natively across blockchains — in **both directions** between Injective EVM Testnet and Ethereum Sepolia.

---

## AI Agent Skill (OpenClaw)

This repo ships a packaged [OpenClaw](https://openclaw.ai) skill that gives AI agents working knowledge of CCTP on Injective — contract addresses, parameter logic, attestation polling, and common failure modes.

```bash
openclaw skill install https://github.com/InjectiveLabs/inj-examples/raw/main/examples/usdc/cctp-injective.skill
```

After install, the skill is auto-triggered when the agent is asked to build, debug, or reason about CCTP transfers involving Injective. See [`skill/SKILL.md`](./skill/SKILL.md) for the full source.

---

## What is CCTP?

Circle's **Cross-Chain Transfer Protocol (CCTP)** enables native USDC transfers between blockchains using a **burn-and-mint** mechanism:

1. **Burn** — USDC is burned on the source chain via the `TokenMessenger` contract
2. **Attest** — Circle's attestation service (Iris API) signs the burn message
3. **Mint** — The signed attestation is submitted on the destination chain, which mints native USDC

This is fundamentally different from traditional bridges that wrap tokens. With CCTP, you get **native USDC** on both ends — no bridge risk, no liquidity fragmentation.

---

## Transfer Directions

This dApp supports two directions:

| Direction | Source | Destination | Source Domain | Dest Domain |
|---|---|---|---|---|
| **INJ → ETH** | Injective EVM Testnet | Ethereum Sepolia | `29` | `0` |
| **ETH → INJ** | Ethereum Sepolia | Injective EVM Testnet | `0` | `29` |

Switch directions using the **Direction Toggle** at the top of the CCTP Transfer tab. All steps — network switching, attestation polling, and minting — automatically adapt to the selected direction.

---

## Contract Addresses

### Injective EVM Testnet (Chain ID: 1439)

| Contract | Address |
|---|---|
| USDC | [`0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d`](https://testnet.blockscout.injective.network/token/0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d) |
| TokenMessengerV2 | [`0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`](https://testnet.blockscout.injective.network/address/0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA) |
| MessageTransmitterV2 | [`0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`](https://testnet.blockscout.injective.network/address/0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275) |

**Network Details:**
- Chain ID: `1439`
- RPC: `https://sentry.json-rpc.testnet.injective.network/`
- Explorer: https://testnet.blockscout.injective.network
- CCTP Domain: `29`

### Ethereum Sepolia (Chain ID: 11155111)

| Contract | Address |
|---|---|
| USDC | [`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238) |
| TokenMessengerV2 | [`0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`](https://sepolia.etherscan.io/address/0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA) |
| MessageTransmitterV2 | [`0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`](https://sepolia.etherscan.io/address/0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275) |

**Network Details:**
- Chain ID: `11155111`
- CCTP Domain: `0`

> **Note:** CCTP v2 contracts share the same address across chains via CREATE2 deployment.

---

## Prerequisites

Before using this dApp, make sure you have:

1. **MetaMask** browser extension installed
2. **Injective EVM Testnet** and/or **Ethereum Sepolia** added to MetaMask (the dApp auto-prompts for network switching)
3. **Testnet INJ** and/or **Sepolia ETH** for gas fees
4. **Testnet USDC** on the source chain

---

## Getting Testnet Tokens

### Testnet INJ (gas on Injective)

👉 https://testnet.faucet.injective.network/

### Testnet Sepolia ETH (gas on Sepolia)

👉 https://sepoliafaucet.com or https://faucet.quicknode.com/ethereum/sepolia

### Testnet USDC (either chain)

👉 https://faucet.circle.com

Select the source chain (Injective or Ethereum Sepolia) and request testnet USDC.

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/InjectiveLabs/inj-examples.git
cd inj-examples/examples/usdc
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Build for production

```bash
npm run build
```

---

## How to Use the dApp

### Dashboard Tab

After connecting your wallet, the Dashboard shows:
- Your **USDC balance** on Injective testnet
- Your **INJ balance** (for gas)
- **Contract addresses** with links to Blockscout
- **Quick links** to faucets and tools

### CCTP Transfer Tab

#### Step 0 — Select Direction

Use the **Direction Toggle** at the top to choose:
- 🔵 **INJ → ETH**: Burn on Injective, mint on Sepolia
- 🔷 **ETH → INJ**: Burn on Sepolia, mint on Injective

Click the ⇅ swap button or the quick-select pills to flip direction. The wizard steps automatically update to reflect the selected direction.

#### Step 1 — Burn USDC

1. The dApp detects if you're on the correct source chain and prompts a switch if needed
2. Enter the **amount** of USDC to transfer
3. Enter the **recipient address** on the destination chain
4. Click **"Approve USDC"** — approves the source TokenMessenger to spend your USDC
5. After approval, click **"Burn & Send"** — initiates the cross-chain burn
6. Wait for the burn transaction to confirm

#### Step 2 — Get Attestation

1. Your burn transaction hash is auto-filled
2. Click **"Fetch Attestation"** — polls Circle's Iris API (sandbox)
3. The API returns `pending_confirmations` while Circle awaits block confirmations (~1–5 min)
4. Auto-polling runs every 15 seconds with a visual countdown bar
5. Once `complete`, the message bytes and attestation signature are shown

#### Step 3 — Mint USDC

1. The dApp detects if you're on the correct destination chain and prompts a switch
2. Once on the right network, click **"Mint USDC"**
3. USDC is minted to the recipient address via `receiveMessage()` on the destination MessageTransmitterV2

---

## Architecture

```
src/
├── main.tsx              # App entry point with Wagmi + React Query providers
├── App.tsx               # Root component with tab navigation (AnimatePresence)
├── wagmi.ts              # Chain config, contract addresses, CCTP domains, Wagmi setup
├── index.css             # Global styles (Tailwind + animations)
│
├── abis/
│   ├── erc20.ts          # ERC20 ABI (balanceOf, approve, allowance)
│   ├── tokenMessenger.ts # CCTP TokenMessengerV2 ABI (depositForBurn)
│   └── messageTransmitter.ts # CCTP MessageTransmitterV2 ABI (receiveMessage)
│
├── components/
│   ├── Header.tsx        # Sticky nav with wallet connect + network badge
│   ├── ConnectWallet.tsx # Landing screen before wallet connected
│   ├── Dashboard.tsx     # Balances, contract refs, quick links
│   ├── CCTPTransfer.tsx  # Bidirectional 3-step CCTP transfer wizard
│   ├── HowItWorks.tsx    # Visual CCTP explainer
│   └── FaucetLinks.tsx   # Quick links to faucets and tools
│
└── hooks/
    ├── useUSDCBalance.ts # Reads USDC balance + allowance (direction-aware)
    └── useAttestation.ts # Polls Circle Iris API (accepts sourceDomain param)
```

**Tech Stack:**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Wagmi v2](https://wagmi.sh/) + [Viem](https://viem.sh/) for EVM interactions
- [Framer Motion](https://www.framer.com/motion/) for animations
- [TailwindCSS](https://tailwindcss.com/) for styling
- [@tanstack/react-query](https://tanstack.com/query) for async state

---

## Key Implementation Notes

### Bidirectional Transfer Design

The `CCTPTransfer` component accepts a `TransferDirection` state (`'inj→sep'` | `'sep→inj'`) that determines:
- Which chain to read USDC balance from
- Which TokenMessenger contract to approve/burn through
- The `destinationDomain` argument for `depositForBurn`
- Which `sourceDomain` to poll Circle's Iris API with
- Which MessageTransmitter to call `receiveMessage` on

### Address Padding (bytes32)

CCTP requires `mintRecipient` to be 32 bytes. Use viem's `padHex`:

```ts
import { padHex } from 'viem'
const mintRecipient = padHex(recipientAddress as `0x${string}`, { size: 32 })
```

### USDC Decimals

USDC uses **6 decimal places**:

```ts
import { parseUnits, formatUnits } from 'viem'
const amount = parseUnits('1.00', 6)  // → 1000000n
const display = formatUnits(1000000n, 6)  // → '1.0'
```

### Circle Attestation API (Sandbox)

```
GET https://iris-api-sandbox.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}
```

- **INJ → ETH**: use sourceDomain `29` (Injective)
- **ETH → INJ**: use sourceDomain `0` (Sepolia)

Poll until `messages[0].status === 'complete'`. The `useAttestation` hook accepts a `sourceDomain` parameter.

### `depositForBurn` Parameters (CCTP v2)

```ts
depositForBurn(
  uint256 amount,
  uint32  destinationDomain,  // 0 = Sepolia, 29 = Injective
  bytes32 mintRecipient,      // padded to 32 bytes
  address burnToken,          // source chain USDC address
  bytes32 destinationCaller,  // 0x0...0 = anyone can relay
  uint256 maxFee,             // 0 = valid since minFee==0 on testnet
  uint32  minFinalityThreshold // 2000 = FINALITY_THRESHOLD_FINALIZED
)
```

---

## Resources

| Resource | Link |
|---|---|
| Circle CCTP Docs | https://developers.circle.com/cctp |
| CCTP Contract Addresses | https://developers.circle.com/cctp/references/contract-addresses |
| Injective USDC Docs | https://docs.injective.network/developers-defi/usdc-stablecoin |
| Injective EVM Docs | https://docs.injective.network/developers-evm |
| Blockscout Explorer | https://testnet.blockscout.injective.network |
| Circle Faucet | https://faucet.circle.com |
| Injective Faucet | https://testnet.faucet.injective.network/ |
| Sepolia Faucet | https://sepoliafaucet.com |

---

## Troubleshooting

### `delayReason: "insufficient_fee"` — Transfer degraded to Standard

**Symptom**: Circle Iris API returns `"pending_confirmations"` + `"delayReason": "insufficient_fee"`. Attestation eventually arrives, but after 15–19 minutes instead of seconds.

**Cause**: You requested Fast Transfer (`minFinalityThreshold ≤ 1000`) but set `maxFee` below the required fee for the route. Circle cannot use its fast allowance and degrades the transfer to Standard, which waits for full L1 finality.

> Per Circle docs: Fast Transfer fees on Ethereum are ~1 bps (0.01%). Standard Transfers are always free. See [Circle fee docs](https://developers.circle.com/cctp/concepts/fees) for current rates per chain.

**Confirm it**:
```bash
curl "https://iris-api-sandbox.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}"
# Look for: "delayReason": "insufficient_fee"
```

**What happens**: The transaction is NOT stuck forever — it will complete as a Standard Transfer (~15–19 min on Ethereum). Keep polling until `status: "complete"`.

**Avoid it next time**: For fast transfers from Ethereum, always set a non-zero `maxFee`. The recommended approach is to query the fee API and add a buffer:

```bash
# Get current fee for your route
curl "https://iris-api-sandbox.circle.com/v2/burn/USDC/fees/{sourceDomain}/{destDomain}"
```

```ts
// Sepolia → Injective (fast mode)
const minFinalityThreshold = 1
const maxFee = 1000n   // 0.001 USDC — covers the ~1 bps fee for typical amounts
                        // For production: query the fee API and add a 20% buffer
```

---

### Attestation takes 15–19 minutes (Ethereum Sepolia as source)

**Cause**: Either:
1. `minFinalityThreshold: 2000` (Standard Transfer) — Circle waits for ~65 Ethereum blocks (~15–19 min). This is expected; Standard Transfers on Ethereum always take this long.
2. `minFinalityThreshold: 1` with insufficient `maxFee` — Circle degrades to Standard Transfer (see above).

**Fix for case 2**: Use `minFinalityThreshold: 1` with a sufficient `maxFee` to stay in fast mode (~20 seconds on Ethereum). The dApp does this automatically for the ETH→INJ direction.

> Already burned with `threshold=2000` or degraded? The tx will complete eventually — just keep polling. Nothing is broken.

---

### CCTP v2 Parameter Quick Reference

| Source | `minFinalityThreshold` | `maxFee` | Result |
|---|---|---|---|
| Injective | `2000` | `0n` | ✅ Standard Transfer, ~0.65 s |
| Sepolia | `2000` | `0n` | ✅ Standard Transfer, ~15–19 min |
| Sepolia | `≤1000` | sufficient | ✅ Fast Transfer, ~20 s |
| Sepolia | `≤1000` | `0n` or too low | ⚠️ Degraded to Standard Transfer, ~15–19 min |

> The fee is deducted from the USDC minted on the destination chain. See [Circle's fee docs](https://developers.circle.com/cctp/concepts/fees) for current rates.

---

### More Issues

For additional troubleshooting (wrong network, reverts, balance reads), see [`skill/references/troubleshooting.md`](./skill/references/troubleshooting.md).

---

## License

MIT — built by [Injective Labs](https://injective.com)
