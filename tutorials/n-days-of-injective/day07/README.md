# Day 7: Running a Local Injective Node

This is part of the N days of Injective series!

## Pre-requisites
 
- Completed day 5 (SDK basics) in this series
- Docker installed on your system
- Basic understanding of blockchain nodes and consensus

## Starter repo (demo)

Welcome back to day 7 of the 7 days of Injective series!
We will be running a local Injective node today!

If you are joining us from day 5, you're all set.
If not, please check the prerequisites.
Let's get started!
Open the terminal and navigate to the `day07` directory within this repo.
This will be our workspace for setting up and running a local Injective node.

```shell
cd day07/
```

## Understanding Injective nodes

Before we start, let's understand what we're building.
An Injective node is a piece of software that participates in the Injective blockchain network.
Nodes maintain a copy of the blockchain state and validate transactions.
They communicate with other nodes to reach consensus on the state of the network.

Running a local node is essential for development and testing.
It allows us to interact with the blockchain without needing testnet tokens or internet connectivity.
We can test smart contracts, simulate transactions, and understand how the protocol works at a deeper level.

## Why Docker?

For this tutorial, we use Docker to run the Injective node.
Docker provides consistency across different operating systems.
The official Injective Docker image includes all necessary dependencies pre-configured.
This eliminates the complexity of building from source and managing Go versions.

If you're running on Linux and prefer building from source,
refer to the official Injective documentation at https://docs.injective.network/infra/join-a-network.

## Setup script overview

The `setup.sh` script automates the initialization of a local Injective chain.
It performs several critical operations:
- Initializes the chain configuration
- Creates genesis accounts with predefined balances
- Imports validator and user keys from mnemonics
- Configures genesis parameters for fast local testing
- Generates and signs the genesis transaction

Let's break down what happens during setup.

## Genesis configuration (demo)

The setup script begins by initializing the chain.

```shell
injectived init injective --chain-id injective-1000
```

This creates the initial chain configuration in `~/.injectived`.
The `--rm` flag ensures the container is removed after execution.
The `-v` flag mounts our local `.injectived` directory into the container.
Note that `--chain-id` is set to a value that is neither Injective Mainnet nor Injective Testnet,
as we are running a (new) local network that does not connect to the public networks.

Next, the script modifies genesis parameters for a developer-friendly local chain:
- Governance voting period: 10 seconds (instead of days)
- Minimum gas prices: 500000000inj
- Fast block times with 2.5 second commits

These changes make local development much faster.
We can test governance proposals and see results immediately.

## Account creation (demo)

The script creates several pre-funded accounts using test mnemonics.
These accounts include validators, users, and signers.

```shell
WASM_KEY="wasm"
WASM_MNEMONIC="juice dog over thing anger search film document sight fork enrich jungle vacuum grab more sunset winner diesel flock smooth route impulse cheap toward"
```

Each account is imported using the `expect` command to handle interactive prompts.
The keyring backend is set to `test` mode, which doesn't require passwords.
This is suitable for local development but should never be used in production.

The genesis account receives a large balance of INJ and other tokens:

```shell
injectived add-genesis-account genesis 1000000000000000000000000inj,...
```

This ensures we have plenty of tokens for testing transactions and smart contracts.

## Running the setup script (demo)

> **Warning**: The setup script will delete the contents of `~/.injectived` directory.
> If you have other instances of injectived running and need to keep that data, make a backup first.
> The script starts with `rm -rf ~/.injectived` to ensure a clean setup.

Time for a demo.
Run the setup script:

```shell
./setup.sh
```

The script will output progress messages as it:
- Initializes the chain
- Configures genesis parameters  
- Imports all test keys
- Allocates genesis accounts
- Signs and collects the genesis transaction
- Validates the genesis file

When you see "Setup done!", the chain is ready to start.

## Configure RPC endpoint

Before starting the node, we need to configure it to accept external connections.
By default, the RPC server only listens on `localhost` within the container.
We need to change this to allow connections from the host machine.

Edit the configuration file:

```shell
vim ~/.injectived/config/config.toml
```

Find the `[rpc]` section and change the DNS from `127.0.0.1` to `0.0.0.0`:

```toml
laddr = "tcp://127.0.0.1:26657"
```

It should now look like this:

```toml
laddr = "tcp://0.0.0.0:26657"
```

This allows the RPC server to accept connections from any network interface.
Combined with Docker's port mapping, we'll be able to query the node from our host machine.

## Start the node (demo)

Now we can start the Injective node.
Run the following command:

```shell
docker run -p 26657:26657 -it --rm -v ~/.injectived:/root/.injectived injectivelabs/injective-core:v1.17.1 injectived --home /root/.injectived start
```

The `-p 26657:26657` flag maps the container's RPC port to your host machine.
The node will begin producing blocks immediately.
You should see log output showing block heights incrementing.

Leave this terminal running.
The node needs to stay active for us to interact with it.

## Query the local node (demo)

Open a new terminal window.
We can now query our local node using the Injective CLI.

First, set up an alias for the dockerized injectived command:

```shell
alias injectived='docker run -it --rm -v ~/.injectived:/root/.injectived injectivelabs/injective-core:v1.17.1 injectived --home /root/.injectived'
```

Now let's query the balance of one of our genesis accounts.
Replace `${YOUR_INJ_PREFIX_ADDR}` with an actual address:

```shell
injectived query bank balances \
   ${YOUR_INJ_PREFIX_ADDR} \
   --chain-id injective-1000 --node "http://host.docker.internal:26657"
```

Notice the `--node` flag specifies how to connect to our local node.
The special hostname `host.docker.internal` allows Docker containers to access the host machine.
This is necessary because we're running the query from within a container.

For example, query the feed admin account which was funded during genesis:

```shell
injectived query bank balances \
   inj1k2z3chspuk9wsufle69svmtmnlc07rvw9djya7 \
   --chain-id injective-1000 --node "http://host.docker.internal:26657"
```

This should show a non-zero balance:

```
balances:
- amount: "100000000000000000000000000"
  denom: inj
pagination:
  next_key: null
  total: "0"
```

## Verifying the setup

We can perform additional checks to ensure everything is working correctly.

Check the node status:

```shell
injectived status --node "http://host.docker.internal:26657"
```

This shows the current block height, chain ID, and other node information.

List all keys in the keyring:

```shell
injectived keys list --keyring-backend test
```

This displays all the accounts we imported during setup.
You should see entries for wasm, localkey, user1, user2, and others.

## What we've accomplished

At this point, we have:
- Initialized a local Injective blockchain
- Configured it for fast local development
- Funded multiple test accounts
- Started a node that's producing blocks
- Successfully queried the node from the command line

This local environment is perfect for testing smart contracts, simulating transactions, and learning how Injective works internally.

## Troubleshooting

If the node fails to start, check the following:
- Ensure Docker is running
- Verify port 26657 is not already in use
- Check that `~/.injectived` was properly initialized

If queries fail with connection errors:
- Verify the node is still running in the other terminal
- Confirm the RPC endpoint is set to `0.0.0.0:26657` in `config.toml`
- Check that port mapping `-p 26657:26657` was included in the start command
- Make sure you set the correct alias for injectived when using the dockerized version

If you see "account not found" errors:
- Verify you're using the correct chain ID: `injective-1000`
- Double-check the account address
- Ensure the account was funded during genesis setup

## Complete!

Congratulations on completing this tutorial.
You now know how to:
- Initialize a local Injective chain with custom parameters
- Import keys and create genesis accounts
- Configure and start a local node
- Query blockchain state from the command line

With a local node running, you have a powerful development environment.
You can deploy smart contracts, test SDK applications, and experiment with Injective features without needing testnet access.

## Stopping the node

When you're done with your local node, you can stop it in several ways.

If the node is running in the foreground (in your terminal), press `Ctrl+C` to stop it.

If you need to stop a Docker container running in the background:

```shell
# List running Docker containers
docker ps

# Find the container ID for injectivelabs/injective-core
# Then stop it
docker stop <container_id>
```

Alternatively, you can stop all running injectived containers:

```shell
docker stop $(docker ps -q --filter ancestor=injectivelabs/injective-core:v1.17.1)
```

For advanced configuration and production deployments, refer to the official Injective documentation at https://docs.injective.network/infra/join-a-network.
