# CCTP Troubleshooting

## `delayReason: "insufficient_fee"` — Transfer degraded to Standard

**Symptom**: Circle Iris API returns `status: "pending_confirmations"` with `delayReason: "insufficient_fee"`. Attestation arrives eventually (~15–19 min), but much slower than expected for a fast transfer request.

**Cause**: You requested Fast Transfer (`minFinalityThreshold ≤ 1000`) but set `maxFee` below the required fee for the route. Circle cannot use its Fast Transfer allowance and silently degrades the transfer to Standard, which waits for full L1 finality.

**Important**: The transaction is NOT stuck forever. It will complete as a Standard Transfer. Keep polling until `status: "complete"`.

**How to confirm**:
```bash
curl "https://iris-api-sandbox.circle.com/v2/messages/{sourceDomain}?transactionHash=YOUR_TX_HASH"
# Look for: "delayReason": "insufficient_fee"
```

**Fix**: For future burns, set a sufficient `maxFee`. The recommended approach (per Circle docs) is to query the fee API and add a 20% buffer:

```ts
// Query current fee: GET /v2/burn/USDC/fees/{sourceDomain}/{destDomain}
// Ethereum source fee: ~1 bps (0.01%)

// Sepolia → Injective (fast mode, safe fixed value for small amounts)
const minFinalityThreshold = 1
const maxFee = 1000n   // 0.001 USDC — covers ~1 bps for transfers up to 10 USDC
                        // For production: query fee API + 20% buffer
```

**Fee deduction**: `maxFee` is deducted from the USDC minted on the destination chain.

---

## Attestation takes 15–19 minutes (Ethereum source)

**Symptom**: `status: "pending_confirmations"` with `delayReason: null`, waiting >10 minutes.

**Cause (case 1)**: `minFinalityThreshold: 2000` (Standard Transfer) — Circle waits for ~65 Ethereum blocks (~15–19 min). This is expected and correct; Standard Transfers on Ethereum always take this long.

**Cause (case 2)**: `minFinalityThreshold ≤ 1000` with `maxFee` too low — Circle degrades to Standard Transfer (see `insufficient_fee` above).

**Fix for case 2**: Use `minFinalityThreshold ≤ 1000` with a sufficient `maxFee` to stay in Fast Transfer mode (~20 s on Ethereum).

Per Circle official docs, Fast Transfer on Ethereum takes ~20 seconds (2 block confirmations).
Standard Transfer takes ~15–19 minutes (~65 blocks).

**Already burned?** Just keep polling — the tx will complete eventually.

---

## Attestation takes forever (Injective source)

**Symptom**: Long wait even with `minFinalityThreshold: 2000` from Injective.

**Note**: This is rare. Injective has ~3s finality, so 2000 is fine. If you see delays, check:
1. Did you use the correct source domain (`29` for Injective)?
2. Is the burn tx confirmed on-chain? Check https://testnet.blockscout.injective.network
3. Is Circle's sandbox API degraded? Check https://status.circle.com

---

## `receiveMessage` reverts on destination

Common reasons:

| Error | Likely Cause |
|---|---|
| `Message already processed` | The tx was already relayed — check destination USDC balance |
| `Invalid attestation` | Used wrong `message` or `attestation` bytes — copy them verbatim from Iris API |
| `Invalid source domain` | The `message` was signed for a different domain |
| `Nonce already used` | Duplicate relay attempt — message was already minted |

---

## MetaMask doesn't pop up

**Cause**: Using `metaMask()` connector (MetaMask SDK) instead of the injected connector.

**Fix**: Use `injected({ target: 'metaMask' })` from `wagmi/connectors` to directly interface with `window.ethereum`.

---

## Wrong network after wallet connect

**Cause**: `useChainId()` returns the currently connected chain, not the required chain.

**Fix**: Check `chainId === requiredChainId` before each contract write. Use `useSwitchChain()` to prompt the user to switch. Always pass an explicit `chainId` to `writeContract()` to prevent silent wrong-chain writes.

---

## USDC balance shows 0 but faucet claims success

**Cause**: Reading balance on the wrong chain (e.g., reading Injective USDC balance when you're on Sepolia, or vice versa).

**Fix**: Make sure `useReadContract` is called with the correct `chainId` and USDC contract address for the chain you want. Injective USDC ≠ Sepolia USDC — they're different token addresses.
