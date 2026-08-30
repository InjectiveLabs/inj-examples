# Injective EVM Foundry Starter

Foundry project template for building and deploying Solidity contracts on [Injective EVM](https://docs.injective.network/developers-evm/smart-contracts).

Includes a local development environment with a dockerized Injective node and block explorer, a deploy script, and Makefile targets for the full build-test-deploy workflow.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (the [docs](https://docs.injective.network/developers-evm/smart-contracts/compile-foundry) use v1.2.3-stable; any recent version works)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (for local devnet)
- Testnet INJ from the [faucet](https://testnet.faucet.injective.network/) (for testnet deployment)

## Quick Start

```bash
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts

cp .env.example .env          # configure RPC_URL and PRIVATE_KEY

make build                     # compile contracts
make test                      # run tests (Foundry in-memory EVM)
```

## Project Structure

```
├── src/                       Solidity contracts
│   └── Counter.sol            Example contract (standard EVM)
├── test/                      Foundry test suite
│   └── Counter.t.sol
├── script/                    Deploy scripts
│   └── Deploy.s.sol           Programmatic deployments — add contracts here
├── vendor/                    Vendored Injective precompile contracts
│   └── fetch.sh               Fetch script — pulls contracts from InjectiveLabs/solidity-contracts
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
| `PRIVATE_KEY` | deploy targets | — |
| `CONTRACT_ADDRESS` | verify targets | — |
| `VERIFIER_URL` | verify targets | `https://testnet.blockscout-api.injective.network/api/` ([docs](https://docs.injective.network/developers-evm/smart-contracts/verify-foundry)) |
| `GAS_PRICE` | deploy targets | `160000000` ([docs](https://docs.injective.network/developers-evm/smart-contracts/deploy-foundry)) |

## Local Development

Run a real Injective node locally with a block explorer. This gives you the full chain environment — precompiles, Cosmos module interop, and real block production.

### First-time setup

The init script runs entirely inside Docker — no local `injectived` binary needed.

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

### Vendoring precompile interfaces

The official Solidity interfaces live in [InjectiveLabs/solidity-contracts](https://github.com/InjectiveLabs/solidity-contracts). Because that repo is a development monorepo with transitive dependencies that break `forge install`, this template includes `vendor/fetch.sh` to pull only the files you need.

To add precompiles to your project:

1. Edit `vendor/fetch.sh` — uncomment or add contracts to the `INTERFACES` and `IMPLEMENTATIONS` arrays
2. Run `./vendor/fetch.sh`
3. Add the remapping to `foundry.toml`:
   ```toml
   remappings = [
     '@injective/=vendor/injective/',
     '@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/',
   ]
   ```
4. Import in your contracts:
   ```solidity
   import {IBankModule} from "@injective/Bank.sol";
   ```

### Deploying precompile contracts

Contracts that call precompiles **cannot** use `forge script` — Foundry's in-memory EVM doesn't have Injective precompiles. Use `forge create` instead, which skips simulation and submits directly:

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

`forge test` has the same limitation — tests that call precompiles will fail with "call to non-contract address". Test precompile contracts against the local devnet or testnet.

For a working example with the Bank precompile, see [`examples/precompiles`](../../examples/precompiles/).

## Foundry Configuration

`foundry.toml` is configured for Injective:

- **Solidity 0.8.28** — matches the [Injective docs](https://docs.injective.network/developers-evm/smart-contracts/compile-foundry)
- **EVM version: cancun** — Injective enables Shanghai, Cancun, and Prague from genesis ([source](https://github.com/InjectiveLabs/injective-core/blob/master/injective-chain/modules/evm/types/chain_config.go))
- **`--legacy` transactions** — required on Injective ([docs](https://docs.injective.network/developers-evm/smart-contracts/deploy-foundry))
- **Gas price `160000000`** — standard Injective minimum ([docs](https://docs.injective.network/developers-evm/network-information))

## Network Reference

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `1439` | `1776` |
| JSON-RPC | `https://k8s.testnet.json-rpc.injective.network/` | `https://sentry.evm-rpc.injective.network/` |
| Explorer | `https://testnet.blockscout.injective.network/` | `https://blockscout.injective.network/` |
| Faucet | `https://testnet.faucet.injective.network/` | — |

## License

MIT
