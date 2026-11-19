# Day 7: Running a Local Injective Node

Start a single-validator Injective chain with the same `v1.21.0` Docker image used by the precompile example. You can query it through the native RPC and EVM JSON-RPC.

## Prerequisites

Install Docker with Docker Compose, `jq`, and Foundry's `cast`. Run these commands from the `inj-examples` repository root.

## Initialize the chain

```bash
./tutorials/n-days-of-injective/day07/setup.sh
```

The script pulls the pinned image, creates a genesis configuration for `injective-1`, funds two development accounts, and prepares a validator. The [local setup script](../../../examples/precompiles/local-dev/setup.sh) writes data under `examples/precompiles/local-dev/data`. It refuses to initialize over existing data, which you can reuse.

## Start the node

```bash
docker compose -f examples/precompiles/local-dev/docker-compose.yml up -d --wait injectived
```

The native RPC listens on port 26657 and the EVM JSON-RPC on port 8545. See the [precompiles example](../../../examples/precompiles/README.md) to start Blockscout or deploy a contract.

## Query the local node

```bash
curl -fsS http://localhost:26657/status | jq '.result.node_info.network'
cast block-number --rpc-url http://localhost:8545
```

The status response should show `injective-1`. The EVM block height should increase when you run the second command again.

List the funded development and validator addresses, then query a balance:

```bash
docker compose -f examples/precompiles/local-dev/docker-compose.yml exec injectived \
  injectived keys list

# Replace INJ_ADDRESS with one of the funded addresses.
docker compose -f examples/precompiles/local-dev/docker-compose.yml exec injectived \
  injectived query bank balances "$INJ_ADDRESS"
```

## Stop the node

```bash
docker compose -f examples/precompiles/local-dev/docker-compose.yml stop injectived
```

Restart the same service to continue using its chain data.
