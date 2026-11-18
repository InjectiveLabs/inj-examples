# Swap precompile demo

Quote and execute spot swaps against the Injective orderbook through the EVM precompile at `0x0000000000000000000000000000000000000068`. Start with the TypeScript example for an automated testnet run, or use Foundry to inspect individual calls and try swaps with a target output.

## What will you verify?

- **Can this market swap the token I hold?** Check the network, market denoms, Circle USDC address, token decimals, and allowlist before quoting.
- **If I use 10 USDC to buy INJ, how much USDC will I spend and how much INJ will I receive?** Read the V2 return values, then reverse the direction and sell INJ for USDC.
- **What happens if the order book moves or my wallet is short on gas?** Derive a minimum output and deadline, then simulate from the funded account and check the gas budget before sending.
- **How can I tell what settled?** Inspect the successful receipt and compare INJ and USDC balances across its block, including INJ after accounting for gas.
- **What if I need a specific output?** Use Foundry to quote the required input and test the maximum input the swap can spend.

## Run the automated INJ/USDC example

Both commands refer to INJ. `buy` buys INJ with Circle USDC, and `sell` sells INJ for Circle USDC. The number is the most you want to spend of the asset you start with.

| Command | Start with | Receive |
| --- | --- | --- |
| `npm run swap -- buy 10` | Up to 10 Circle USDC as input | Native INJ |
| `npm run swap -- sell 0.1` | Up to 0.1 native INJ as input | Circle USDC |

Try either direction independently. Quotes need no funds. To simulate or execute a buy, fund the account with 10 USDC and enough INJ for gas. To simulate or execute a sell, fund it with 0.1 INJ plus enough INJ for gas.

[Viem](https://viem.sh/) is a TypeScript library for interacting with networks compatible with Ethereum. Here it encodes calls from the swap ABI, decodes the results, simulates execution, estimates gas, submits an explicitly requested transaction, and reads the receipt. The example uses Injective’s native REST API alongside viem to check the market and allowlist.

### Check the network and tokens

| Setting | Value |
| --- | --- |
| EVM chain ID | `1439` |
| Native chain ID | `injective-888` |
| EVM RPC | `https://k8s.testnet.json-rpc.injective.network/` |
| Chain REST API | `https://k8s.testnet.lcd.injective.network` |
| Spot market ID | `0x0f6ee483a7f7f633fe6e3f03d34e01e129b5a5023eb7b0fe1e8a56e5ac8779a6` |
| Base asset | INJ, 18 decimals. Use the zero address in the swap call. |
| Quote asset | Circle USDC, 6 decimals. Use `0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d` in the swap call. |

The market’s base denom is `inj`. Its quote denom is `erc20:` followed by the checksummed Circle USDC address. To inspect the mapping yourself, query the ERC20 module:

```bash
curl -fsSG 'https://k8s.testnet.lcd.injective.network/injective/erc20/v1beta1/token_pair_by_erc20_address' \
  --data-urlencode 'erc20_address=0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d' \
  | jq '.token_pair | {bank_denom, erc20_address}'
```

The chain resolves this denom from the USDC contract address. Confirm the deployment address with [Circle’s USDC contract reference](https://developers.circle.com/stablecoins/usdc-contract-addresses).

### Read a quote

Install Node.js 22 or later. From `examples/swap-precompile`, run:

```bash
cd viem
npm ci
npm run build
npm run swap -- buy 10
npm run swap -- sell 0.1
```

Quote mode needs neither a wallet address nor a private key. It checks both testnet chain IDs, the active market, token denoms, ERC20 address and decimals, and the allowlist. Enter amounts as decimals, with at most 6 places for USDC or 18 for INJ. The CLI converts them to the smallest units.

The two directions use different orders. Buying INJ requires resting INJ sell orders. Selling INJ requires resting buy orders funded with Circle USDC. These example quotes illustrate how to read the output. Request a fresh quote for your trade.

| Trade | Input budget | Estimated spend | Estimated unspent input | Estimated output |
| --- | --- | --- | --- | --- |
| Buy INJ | 10 USDC | 9.999977 USDC | 0.000023 USDC | 9.8891 INJ |
| Sell INJ | 0.1 INJ | 0.1 INJ | 0 INJ | 0.098881 USDC |

The buy leaves 0.000023 USDC unspent after rounding the fill to the market’s quantity tick. Gas is charged separately in INJ. With the default tolerance of 50 basis points, the CLI calculates `minOut = quotedOut * 9950 / 10000` in the smallest output unit, rounding down. In this buy example, the minimum output is 9.8396545 INJ.

### Simulate the swap

Copy [`.env.example`](viem/.env.example) to `.env` and set `SENDER` to a funded testnet account’s public EVM address. Get test INJ from the [Injective faucet](https://testnet.faucet.injective.network/) and test USDC from the [Circle faucet](https://faucet.circle.com/) by selecting Injective.

```bash
npm run swap -- buy 10 --simulate
npm run swap -- sell 0.1 --simulate
```

The simulation checks the full input budget and the INJ needed for estimated gas. The example uses a 20% gas buffer and sets the deadline 120 seconds after the latest block timestamp. Set `SLIPPAGE_BPS` to change the price tolerance. If a quote or simulation fails, see [Troubleshooting](#troubleshooting).

### Submit and verify

To execute, configure `PRIVATE_KEY` for a dedicated testnet account in the local `.env` and pass `--send`. The example repeats the checks and simulation before submitting:

```bash
npm run swap -- buy 10 --send
npm run swap -- sell 0.1 --send
```

Each submission is a separate trade with its own quote, fee, and order book impact. If you sell after buying, the amount of USDC you receive depends on the sell quote and fill.

The CLI prints an explorer link, checks receipt status, and compares balances at the block before inclusion and the receipt block. The simulation reports estimated return values. Use the successful receipt and native exchange events or balance changes to verify settlement. The balance report includes INJ with and without gas. Use an account without other activity in that block to attribute those changes to the swap.

### Use a different market or network

For another market or mainnet, use the Foundry walkthrough below. Select matching EVM and REST endpoints from the [network reference](https://docs.injective.network/developers-evm/network-information), then check the actual market denoms, token addresses, decimals, quantity tick, minimum notional, and allowlist. Mainnet uses EVM chain ID `1776` and native chain ID `injective-1`.

The TypeScript CLI expects the testnet INJ/Circle USDC pair. To adapt it, change the network, market, and token checks in [`config.ts`](viem/src/config.ts) and the direction, units, and balance reporting in [`swap.ts`](viem/src/swap.ts) together.

## Foundry prerequisites

- Install [Foundry](https://getfoundry.sh/introduction/installation/) and `jq`, then clone [inj-examples](https://github.com/InjectiveLabs/inj-examples). From the clone, enter `examples/swap-precompile` and run `make build`. The example has no Solidity dependencies to install.
- For transactions, fund your testnet account with INJ for gas and the input token for the route. See the [testnet faucets and explorers](https://chain.injective.network/testnet). Quotes need neither an account nor a balance.

The V2 methods, execution for a target output, and resolution of native EVM tokens under the MultiVM Token Standard (MTS) are available on v1.21, including testnet build `v1.21.0-beta`. The original V1 methods quote and execute swaps with an input budget and quote the input required for a target output. They are available from v1.20.4.

## Testnet walkthrough

### 1. Check the market

```bash
export RPC_URL=https://sentry.json-rpc.testnet.injective.network/
LCD=https://testnet.sentry.lcd.injective.network
SWAP=0x0000000000000000000000000000000000000068

# USDT/USDC: test selling Circle USDC on Injective EVM.
export MARKET_ID=0x67462ddc4a045e175da8d8310f59a6c33c9994ef98ced0a31ffd977af9da9703
export TOKEN_IN=0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d
export AMOUNT_IN=10000000  # 10 USDC, with 6 decimals

cast chain-id --rpc-url "$RPC_URL"  # Expect 1439.
curl -fsS "$LCD/injective/exchange/v2/spot/markets/$MARKET_ID" | jq '.market'
curl -fsS "$LCD/injective/exchange/v2/exchangeParams" | jq '.params.swap_params'
```

Confirm the market is active, `enabled` is true, and `allowed_markets` contains the exact market ID. If this market is missing or the list is empty, request access from your Injective partner contact or in `#developers` on the [Injective Discord](https://discord.gg/injective). A revert containing `not allowlisted for swaps` confirms the call reached the precompile. Use the [localnet demo](#full-localnet-demo) while you wait for an allowlisted route.

Choose the other side's ERC20 address from the market's bank denominations to quote the input required for a target output. The [ERC20 module](https://docs.injective.network/developers-evm/erc20-module) exposes registered pairs. Circle USDC on Injective EVM resolves through its `erc20:` bank denom. On any route, convert amounts to the smallest units of the corresponding token.

For the INJ/Circle USDC route, check market `0x0f6ee483a7f7f633fe6e3f03d34e01e129b5a5023eb7b0fe1e8a56e5ac8779a6` using the same market and allowlist queries. Confirm the base denom is `inj` and the quote denom is Circle's `erc20:` USDC. Keep the USDC input settings above to buy INJ. To sell 0.1 INJ, use `TOKEN_IN=0x0000000000000000000000000000000000000000` and `AMOUNT_IN=100000000000000000`. Check liquidity in each direction.

### 2. Quote and simulate a swap with an input budget

```bash
make quote-v2
```

The first result is projected input spent and the second is projected output. Thin liquidity and quantity ticks can leave some input unspent. Quotes estimate orderbook fills and can differ from execution. Choose a positive `MIN_OUT` in output units from the quote and your slippage tolerance. For example, for 50 basis points of tolerance, multiply the quoted output by 9,950, divide by 10,000, and round down. Set `SENDER` to the funded account's EVM address. The zero recipient below credits the caller.

```bash
SENDER=0x...  # Funded EVM account.
MIN_OUT=...   # Your minimum acceptable amount in output base units.
RECIPIENT=0x0000000000000000000000000000000000000000
DEADLINE=$(( $(date +%s) + 300 ))

INPUT_SIG='swapExactInputV2(address,string,uint256,uint256,address,uint256)'
cast call "$SWAP" "$INPUT_SIG(uint256,uint256)" \
  "$TOKEN_IN" "$MARKET_ID" "$AMOUNT_IN" "$MIN_OUT" "$RECIPIENT" "$DEADLINE" \
  --from "$SENDER" --rpc-url "$RPC_URL"
INPUT_DATA=$(cast calldata "$INPUT_SIG" \
  "$TOKEN_IN" "$MARKET_ID" "$AMOUNT_IN" "$MIN_OUT" "$RECIPIENT" "$DEADLINE")
```

The simulation returns `(amountInSpent, amountOut)` and leaves balances unchanged. Compare `AMOUNT_IN - amountInSpent` with your fill tolerance, expressed in input units. In particular, a quantity tick is denominated in the **base** token, so its value must be converted when the input is the quote token.

### 3. Quote and simulate a swap with a target output

Set `TOKEN_OUT` to the token you want to receive on the same market and `AMOUNT_OUT` to the requested amount in its smallest units. The input token is the market's other side.

```bash
export TOKEN_OUT=0x... # Output token address, or the zero address for native INJ.
export AMOUNT_OUT=... # Requested output in base units.
make quote-out
```

Use the quoted input and your price tolerance to set `MAX_AMOUNT_IN`. The call delivers at least `AMOUNT_OUT` within that cap or reverts. Quantity ticks can cause slightly more output to be delivered.

```bash
MAX_AMOUNT_IN=... # Input cap in the input token's base units.
DEADLINE=$(( $(date +%s) + 300 ))

OUTPUT_SIG='swapExactOutputV1(address,string,uint256,uint256,address,uint256)'
cast call "$SWAP" "$OUTPUT_SIG(uint256,uint256)" \
  "$TOKEN_OUT" "$MARKET_ID" "$AMOUNT_OUT" "$MAX_AMOUNT_IN" "$RECIPIENT" "$DEADLINE" \
  --from "$SENDER" --rpc-url "$RPC_URL"
OUTPUT_DATA=$(cast calldata "$OUTPUT_SIG" \
  "$TOKEN_OUT" "$MARKET_ID" "$AMOUNT_OUT" "$MAX_AMOUNT_IN" "$RECIPIENT" "$DEADLINE")
```

The simulation returns `(amountInSpent, amountOutDelivered)`. Try a cap below the current quote to verify the revert path.

### 4. Execute and verify

Refresh the quote and deadline just before submitting. Use your wallet to send a testnet transaction from `SENDER` to `SWAP` with `INPUT_DATA` or `OUTPUT_DATA` as calldata and a value of zero. For example, with your own existing Foundry keystore account:

```bash
cast send "$SWAP" "$INPUT_DATA" --account "$ACCOUNT" --rpc-url "$RPC_URL"
```

Check for a successful transaction receipt with `cast receipt "$TX_HASH" --rpc-url "$RPC_URL"`. Solidity return values shown during simulation are estimates. To verify settlement, use native exchange events or compare sender and recipient balances from the blocks before and after inclusion when there is no other account activity. Use ERC20 `balanceOf` for MTS tokens and `cast balance` for native INJ. Account for INJ gas and rounding to the smallest unit when comparing balance deltas to simulated return values. The precompile debits the immediate caller's bank balance, so it needs no ERC20 approval.

### Troubleshooting

| Symptom | Check |
|---|---|
| Market is missing from the allowlist | Query `SwapParams` on the target network. Request the market through your Injective partner contact or use the [localnet demo](#full-localnet-demo). |
| Token cannot be resolved or matches neither market side | Confirm the RPC network and compare the resolved bank denom with the market's actual base and quote denoms. |
| Unknown V2 method | Check that the node runs v1.21 or its testnet beta. |
| Quote shows little or no output | Check the opposing orders, market size and notional limits, and the quantity tick. |
| Output below the minimum or deadline passed | Refresh the quote, recalculate `minOut`, and use a new deadline. |
| Insufficient funds | Fund the full input budget and keep enough INJ for gas. Selling INJ requires both amounts in the same balance. |
| Value transfer rejected | Send the call with zero transaction value. Even a swap that sells INJ uses the caller’s existing bank balance. |
| Quote succeeds but execution still reverts | Simulate from the funded caller. Check token restrictions and whether the exchange is only accepting orders that add liquidity. |

## Project files

| File | What it demonstrates |
|---|---|
| [`src/ISwapModule.sol`](src/ISwapModule.sol) | The ABI for all six methods, token resolution, amount units, and return values. |
| [`src/SwapDemo.sol`](src/SwapDemo.sol) | `quoteV2` and `swapV2` for swaps with an input budget, `minOut`, and `maxUnspent`. Use `swapForOutput` to execute a swap with a target output. `swapV2` rolls back the swap if the unspent amount exceeds `maxUnspent`. The original V1 wrappers are also available. |
| [`Makefile`](Makefile) and [`.env.example`](.env.example) | Commands for quoting swaps and the original V1 deployment and execution commands. |
| [`localnet-demo.sh`](localnet-demo.sh) | A fresh chain, token pair, spot market, allowlist, liquidity, and swap execution. |

For contract composition, the contract holds the input funds and calls the precompile. Use the testnet simulations to set the price bounds before invoking the demo wrapper. `SwapDemo` allows any caller to spend its funds and choose a recipient. Use a disposable deployment with small test balances. Give a production contract its own authorization and accounting.

## Full localnet demo

Install [`injectived` v1.21.0](https://github.com/InjectiveFoundation/injective-core/releases/tag/v1.21.0-1794954936), `cast`, and Python 3, then run:

```bash
SWAP_API_VERSION=2 ./localnet-demo.sh
```

The script initializes a fresh local chain, creates a TokenFactory USDC token and its ERC20 pair, lists and allowlists an INJ/USDC spot market, posts liquidity, and runs swaps with an input budget through V2 and swaps with a target output. It uses disposable local keys. It creates a temporary chain home by default and stops its node on exit. Pass a new directory as the first argument to choose the chain home. The local node needs ports 26657, 8545, and 9900 available. Running without `SWAP_API_VERSION=2` keeps the original V1 demo for v1.20.4 and later.

Standard Foundry's simulated EVM lacks Injective's native precompiles. Use `cast` against an Injective node for simulation and execution. For the protocol reference, see the [Swap Precompile docs](https://docs.injective.network/developers-evm/swap-precompile).
