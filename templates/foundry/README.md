# Injective EVM Foundry Starter

Foundry project template for building and deploying Solidity contracts on [Injective EVM](https://docs.injective.network/developers-evm/smart-contracts).

Includes a local development environment with a dockerized Injective node and block explorer, a deploy script, and Makefile targets for the full build-test-deploy workflow.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (the [docs](https://docs.injective.network/developers-evm/smart-contracts/compile-foundry) use v1.2.3-stable; any recent version works)
- [Docker](https://docs.docker.com/get-docker/), Docker Compose, and `jq` (for local devnet)
- Testnet INJ from the [faucet](https://testnet.faucet.injective.network/) (for testnet deployment)

## Quick Start

```bash
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts

cp .env.example .env          # configure RPC_URL and PRIVATE_KEY

forge build                    # compile the template's Solidity contracts
make test                      # run tests (Foundry in-memory EVM)
```

## Project Structure

```
├── src/                       Solidity contracts
│   └── Counter.sol            Example contract (standard EVM)
├── test/                      Foundry test suite
│   └── Counter.t.sol
├── script/                    Deploy scripts
│   └── Deploy.s.sol           Programmatic deployments (add contracts here)
├── vendor/                    Vendored Injective precompile contracts
│   └── fetch.sh               Fetches contracts from InjectiveLabs/solidity-contracts
├── local-dev/                 Local development environment
│   ├── docker-compose.yml     Injective node + Blockscout explorer
│   └── setup.sh               One-time chain initialization
├── .env.example               Configuration template
├── foundry.toml               Foundry config (Solidity 0.8.28, EVM cancun)
└── Makefile                   Workflow targets
```

## Configuration

Copy `.env.example` to `.env` and set your values:

| Variable | Required for | Default |
|---|---|---|
| `RPC_URL` | testnet targets | `https://k8s.testnet.json-rpc.injective.network/` ([docs](https://docs.injective.network/developers-evm/network-information)) |
| `PRIVATE_KEY` | deploy targets | None |
| `CONTRACT_ADDRESS` | verify targets | None |
| `VERIFIER_URL` | verify targets | `https://testnet.blockscout-api.injective.network/api/` ([docs](https://docs.injective.network/developers-evm/smart-contracts/verify-foundry)) |
| `GAS_PRICE` | deploy targets | `160000000` ([docs](https://docs.injective.network/developers-evm/smart-contracts/deploy-foundry)) |

## Local Development

Run a real Injective node locally with a block explorer. This gives you the full chain environment, including precompiles, Cosmos module interop, and real block production.

### First-time setup

The init script pulls the published `injectivelabs/injective-core:v1.21.0` image and uses `jq` for genesis configuration. If you override `INJ_IMAGE`, use the same value for `make local-init` and `make local-start`.

```bash
make local-init      # pulls Docker image, initializes chain with pre-funded dev accounts (one-time)
```

This creates two dev accounts, each funded with 1000 INJ. The script prints their mnemonics and shows how to derive EVM private keys with `cast wallet private-key --mnemonic "..."`. Set `PRIVATE_KEY` in `.env` to one of them.

### Start the devnet

```bash
make local-start     # starts injectived + Blockscout
```

| Service | URL |
|---|---|
| Injective node (EVM JSON-RPC) | `http://localhost:8545` |
| Blockscout explorer | `http://localhost:3000` |
| Blockscout API | `http://localhost:4000` |

### Lifecycle

```bash
make local-stop      # stop all containers
make local-start     # restart (chain state persists)
make local-clean     # wipe everything and start fresh (requires make local-init again)
```

### Deploy to local devnet

```bash
make local-deploy    # deploy contracts via forge script
```

## Deploying Contracts

Add contracts to `script/Deploy.s.sol` and deploy:

```bash
make local-deploy          # to local devnet
make testnet-deploy        # to testnet
```

After deployment, set `CONTRACT_ADDRESS` in `.env` and verify on [Blockscout](https://testnet.blockscout.injective.network/):

```bash
make testnet-verify
```

## Integrating Injective Precompiles

Injective exposes native chain modules to Solidity through [precompiled contracts](https://docs.injective.network/developers-evm/precompiles) at fixed addresses:

| Precompile | Address | Module |
|---|---|---|
| [Bank](https://docs.injective.network/developers-evm/bank-precompile) | `0x0000...0064` | Token minting, burning, transfers via `x/bank` |
| [Exchange](https://docs.injective.network/developers-evm/exchange-precompile) | `0x0000...0065` | Order book trading via `x/exchange` |
| [Staking](https://docs.injective.network/developers-evm/staking-precompile) | `0x0000...0066` | Validator staking via `x/staking` |
| [Oracle](https://docs.injective.network/developers-evm/oracle-precompile) | `0x0000...0067` | Price feeds via `x/oracle` |
| [Swap](https://docs.injective.network/developers-evm/swap-precompile) | `0x0000...0068` | Spot swaps against the native order book |
| [IBC](https://docs.injective.network/developers-evm/ibc-precompile) | `0x0000...0069` | Outbound ICS-20 transfers and inbound EVM hooks |

### Vendoring precompile interfaces

`make foundry` copies the v1.21 Swap and IBC interfaces into the generated project’s `vendor/injective/` directory. The template already includes the `@injective/` remapping, so both interfaces are available as soon as the project is created:

```solidity
import {ISwapModule} from "@injective/Swap.sol";
import {IIBCModule} from "@injective/IBC.sol";
```

The [swap demo](https://github.com/InjectiveLabs/inj-examples/tree/main/examples/swap-precompile) and [IBC demo](https://github.com/InjectiveLabs/inj-examples/tree/main/examples/ibc-precompile) show how to use these interfaces. To add other contracts from [solidity-contracts](https://github.com/InjectiveLabs/solidity-contracts), select them in `vendor/fetch.sh` and run the script. The script can refresh `IBC.sol` and preserves the scaffold’s `Swap.sol`.

### Deploying precompile contracts

Contracts that call precompiles **cannot** use `forge script` because Foundry's in-memory EVM doesn't have Injective precompiles. Use `forge create` to skip simulation and submit directly.

```bash
forge create src/YourToken.sol:YourToken \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-price 160000000 \
  --gas-limit 2000000 \
  --value 1ether \
  --broadcast
```

`forge test` has the same limitation. Tests that call precompiles will fail with "call to non-contract address". Test precompile contracts against the local devnet or testnet.

For a working example with the Bank precompile, see [`examples/precompiles`](../../examples/precompiles/).

## Foundry Configuration

`foundry.toml` is configured for Injective:

- **Solidity 0.8.28** matches the version in the [Injective docs](https://docs.injective.network/developers-evm/smart-contracts/compile-foundry).
- **EVM version: cancun**
- **`--legacy` transactions** are required on Injective. [Deployment docs](https://docs.injective.network/developers-evm/smart-contracts/deploy-foundry)
- **Gas price `160000000`** is the standard Injective minimum. [Network information](https://docs.injective.network/developers-evm/network-information)

## Network Reference

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `1439` | `1776` |
| JSON-RPC | `https://k8s.testnet.json-rpc.injective.network/` | `https://sentry.evm-rpc.injective.network/` |
| Explorer | `https://testnet.blockscout.injective.network/` | `https://blockscout.injective.network/` |
| Faucet | `https://testnet.faucet.injective.network/` | None |

## License

MIT
