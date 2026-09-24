# Injective Precompiles Example

Working example of integrating [Injective precompiles](https://docs.injective.network/developers-evm/precompiles) in a Foundry project. Includes all native precompile interfaces (Bank, Exchange, Oracle, Staking, and the Swap precompile added in v1.20.4), a Bank precompile ERC-20 token (`InjectiveToken`), and the local development environment for testing.

The local node (`local-dev/`) is pinned to `injectivelabs/injective-core:v1.20.4`, so every precompile up to and including Swap (`0x68`) is available at `localhost:8545`. Override with `INJ_IMAGE=...` when running `setup.sh`. Note the swap allowlist starts empty on a fresh chain (`SwapParams` defaults to enabled with no markets); launch a spot market and allowlist it via `MsgUpdateSwapParams` before swapping. See the focused [swap precompile example](../swap-precompile/) for the interface and quote/swap flow.

This project was scaffolded from the [`foundry` template](../../templates/foundry/) and extended with precompile contracts.

## Quick Start

```bash
# Install Foundry dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts

cp .env.example .env

# Build (compiles all contracts including precompile-based ones)
make build

# Run standard EVM tests (Counter only, precompile contracts need a real node)
make test

# Start local Injective devnet
make local-init              # one-time: initialize chain with funded dev accounts
make local-start             # start injectived + Blockscout explorer

# Deploy
make local-deploy            # Counter (standard EVM, via forge script)
make local-deploy-token      # InjectiveToken (Bank precompile, via forge create)
```

## What's Inside

### Contracts

| Contract | Type | Deploy with |
|---|---|---|
| `src/Counter.sol` | Standard EVM | `make local-deploy`, uses `forge script` via [`script/Deploy.s.sol`](script/Deploy.s.sol) |
| `src/InjectiveToken.sol` | Bank precompile | `make local-deploy-token`, uses `forge create` (see [`script/Deploy.s.sol`](script/Deploy.s.sol) for why) |

Standard EVM contracts go in `script/Deploy.s.sol` and deploy with `forge script`. Precompile contracts like `InjectiveToken` cannot use `forge script` because Foundry's in-memory EVM doesn't have Injective precompiles, so they must use `forge create` which submits directly without simulation. See the comments in `Deploy.s.sol` for the exact command.

### Vendored Precompile Interfaces

All native Injective precompile interfaces are vendored in `vendor/injective/` and importable via `@injective/`:

| File | Interface | Address | Module |
|---|---|---|---|
| `Bank.sol` | `IBankModule` | `0x0000...0064` | Token minting, burning, transfers via [`x/bank`](https://docs.injective.network/developers-evm/bank-precompile) |
| `Exchange.sol` | `IExchangeModule` | `0x0000...0065` | Order book trading via [`x/exchange`](https://docs.injective.network/developers-evm/exchange-precompile) |
| `Staking.sol` | `IStakingModule` | `0x0000...0066` | Validator staking via [`x/staking`](https://docs.injective.network/developers-evm/staking-precompile) |
| `Oracle.sol` | `IOracleModule` | `0x0000...0067` | Price feeds via [`x/oracle`](https://docs.injective.network/developers-evm/oracle-precompile) |
| `Swap.sol` | `ISwapModule` | `0x0000...0068` | Native spot swaps against the orderbook, added in v1.20.4. See the [swap precompile example](https://github.com/InjectiveLabs/inj-examples/tree/main/examples/swap-precompile) |

Supporting files: `CosmosTypes.sol` (Cosmos.Coin struct), `ExchangeTypes.sol` (Exchange enums and fixed-point types).

Bank precompile implementations: `BankERC20.sol` (abstract ERC-20 backed by Bank), `MintBurnBankERC20.sol` (owner-controlled mint/burn).

To update vendored contracts to the latest upstream version:

```bash
make vendor    # runs vendor/fetch.sh
```

`Swap.sol` is not yet published in the upstream [solidity-contracts](https://github.com/InjectiveLabs/solidity-contracts) repo, so it is maintained locally and preserved by `fetch.sh` across re-vendors.

## Integration Guide

### How precompiles work

Precompiles are contracts deployed at fixed addresses by the Injective chain itself. They expose native Cosmos module functionality to Solidity. You call them like any other contract, but the execution happens inside the chain's Go code rather than in the EVM.

```solidity
import {IBankModule} from "@injective/Bank.sol";

IBankModule constant BANK = IBankModule(0x0000000000000000000000000000000000000064);

// Query a token's total supply
uint256 supply = BANK.totalSupply(address(myToken));
```

### Key difference: `forge script` vs `forge create`

Foundry's `forge script` simulates transactions in its built-in EVM before broadcasting. That EVM doesn't have Injective precompiles, so any call to a precompile address (like `0x64`) fails with "call to non-contract address".

**Standard EVM contracts** (no precompile calls): use `forge script`, since simulation works fine.

```bash
make local-deploy          # uses forge script
```

**Precompile contracts** (call Bank, Exchange, Oracle, or Staking): use `forge create`, which skips simulation and submits the transaction directly to the node.

```bash
make local-deploy-token    # uses forge create
```

The same applies to `forge test`. Tests that call precompiles will fail in Foundry's EVM. Test precompile contracts against the local devnet or testnet instead.

### Building an ERC-20 with the Bank precompile

The Bank precompile lets you create tokens that exist simultaneously as EVM ERC-20s and native Cosmos denoms. Balances are unified, with no bridging between EVM and Cosmos.

#### Step 1: Vendor the contracts

The Bank precompile interfaces are already vendored in this project. If starting fresh from the template, edit `vendor/fetch.sh` to include `Bank.sol`, `CosmosTypes.sol`, `BankERC20.sol`, and `MintBurnBankERC20.sol`, then run it.

#### Step 2: Write your token

See `src/InjectiveToken.sol` for a minimal example:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MintBurnBankERC20} from "@injective/MintBurnBankERC20.sol";

contract InjectiveToken is MintBurnBankERC20 {
    constructor()
        payable
        MintBurnBankERC20(
            msg.sender,        // owner, can mint and burn
            "Injective Token",
            "INJT",
            18
        )
    {}
}
```

`MintBurnBankERC20` inherits from `BankERC20`, which routes all ERC-20 operations (`transfer`, `balanceOf`, `totalSupply`, etc.) through the Bank precompile at `0x64`. The precompile stores token state in the native `x/bank` module.

The constructor is `payable` because deploying a Bank-backed ERC-20 costs **1 INJ** (denom spam prevention fee, see [docs](https://docs.injective.network/developers-evm/erc20-module)).

#### Step 3: Deploy

```bash
# Local devnet
forge create src/InjectiveToken.sol:InjectiveToken \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-price 160000000 \
  --gas-limit 2000000 \
  --value 1ether \
  --broadcast
```

Or use the Makefile target: `make local-deploy-token`

Key flags:
- `--legacy`: required on Injective (no EIP-1559)
- `--value 1ether`: pays the 1 INJ denom creation fee
- `--gas-price 160000000`: standard Injective minimum gas price

#### Step 4: Interact

After deployment, the token is a standard ERC-20. You can also interact with it through the Bank precompile:

```bash
# Mint 1000 tokens to an address (owner only)
cast send $TOKEN_ADDRESS "mint(address,uint256)" $RECIPIENT 1000000000000000000000 \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  --legacy --gas-price 160000000

# Check balance via ERC-20
cast call $TOKEN_ADDRESS "balanceOf(address)" $RECIPIENT \
  --rpc-url http://localhost:8545

# Check balance via Bank precompile (same result, balances are unified)
cast call 0x0000000000000000000000000000000000000064 \
  "balanceOf(address,address)" $TOKEN_ADDRESS $RECIPIENT \
  --rpc-url http://localhost:8545
```

### Using other precompiles

#### Oracle: read price feeds

```solidity
import {IOracleModule} from "@injective/Oracle.sol";

IOracleModule constant ORACLE = IOracleModule(0x0000000000000000000000000000000000000067);

// Get BTC/USD price (Stork oracle, type 12)
// Returns price scaled by 1e18
uint256 btcPrice = ORACLE.oraclePrice(12, "BTC", "USD");

// Get full price state including timestamps (useful for staleness checks)
IOracleModule.PricePairState memory state = ORACLE.oraclePricePairState(12, "BTC", "USD");
```

Oracle type values: `2` = PriceFeed, `3` = Coinbase, `9` = Pyth, `11` = Provider, `12` = Stork, `13` = ChainlinkDataStreams.

#### Exchange: on-chain order book

```solidity
import {IExchangeModule} from "@injective/Exchange.sol";

IExchangeModule constant EXCHANGE = IExchangeModule(0x0000000000000000000000000000000000000065);

// Deposit funds from bank balance to exchange subaccount
EXCHANGE.deposit(msg.sender, "", "inj", amount);

// Create a spot limit order
IExchangeModule.SpotOrder memory order = IExchangeModule.SpotOrder({
    marketID: "0x...",
    subaccountID: "0x...",
    feeRecipient: "inj1...",
    price: 1050000000000000000,       // 1.05 (18-decimal scaled)
    quantity: 100000000000000000000,   // 100.0
    cid: "my-order-1",
    orderType: "buy",
    triggerPrice: 0
});
EXCHANGE.createSpotLimitOrder(msg.sender, order);
```

Exchange numeric fields use **API format**, human-readable values scaled by 18 decimals (e.g., `5250000000000000000` = 5.25).

#### Staking: delegate and earn rewards

```solidity
import {IStakingModule} from "@injective/Staking.sol";

IStakingModule constant STAKING = IStakingModule(0x0000000000000000000000000000000000000066);

// Delegate 10 INJ to a validator
STAKING.delegate("injvaloper1...", 10000000000000000000);

// Query delegation
(uint256 shares, Cosmos.Coin memory balance) = STAKING.delegation(
    msg.sender,
    "injvaloper1..."
);

// Withdraw staking rewards
Cosmos.Coin[] memory rewards = STAKING.withdrawDelegatorRewards("injvaloper1...");
```

## Local Development

### First-time setup

```bash
make local-init      # pulls Docker image, initializes chain with pre-funded accounts
```

Creates two dev accounts with 1000 INJ each. The script prints mnemonics. Derive EVM private keys with `cast wallet private-key --mnemonic "..."` and set `PRIVATE_KEY` in `.env`.

### Run the devnet

```bash
make local-start     # starts injectived + Blockscout
```

| Service | URL |
|---|---|
| Injective node (JSON-RPC) | `http://localhost:8545` |
| Blockscout explorer | `http://localhost:3000` |

### Lifecycle

```bash
make local-stop      # stop containers
make local-start     # restart (state persists)
make local-clean     # wipe everything (requires make local-init again)
```

## Testnet Deployment

```bash
# Set RPC_URL and PRIVATE_KEY in .env
make testnet-deploy        # standard contracts
make testnet-deploy-token  # InjectiveToken (Bank precompile)
```

Verify on [Blockscout](https://testnet.blockscout.injective.network/):

```bash
# Set CONTRACT_ADDRESS in .env
make testnet-verify
```

## Network Reference

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `1439` | `1776` |
| JSON-RPC | `https://sentry.json-rpc.testnet.injective.network/` | `https://sentry.evm-rpc.injective.network/` |
| Explorer | `https://testnet.blockscout.injective.network/` | `https://blockscout.injective.network/` |
| Faucet | `https://testnet.faucet.injective.network/` | n/a |

## License

MIT
