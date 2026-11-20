# Injective Examples

Injective Examples is a collection of starter projects and reference implementations for applications and smart contracts on Injective. It includes Foundry, Hardhat, and React templates, demos for precompiles, orderbook swaps, and cross-chain transfers, and tutorials on the CLI, SDK, and local node setup.

## Development Setup

Clone the repository. Tooling requirements vary by project.

```bash
git clone https://github.com/InjectiveLabs/inj-examples.git
cd inj-examples
```

### Contract and app tooling

- **Foundry** provides `forge` to compile and test Solidity contracts and `cast` to query RPC endpoints and interact with deployed contracts. The Foundry template and the precompiles, swap, IBC, ACME Bridge, and LayerZero OFT examples use these tools. [Install Foundry](https://getfoundry.sh/introduction/installation/)
- **Node.js and npm** are required for the Hardhat and React templates, the USDC bridge app, and the TypeScript swap CLI. The USDC app and swap CLI require Node.js 22 or later.
- **GNU Make** scaffolds templates from the repository root and runs shortcuts for the Foundry examples.

Individual project READMEs list any additional tools, such as `jq`, Python 3, or the Solana toolchain.

### Connect to a network

Public Testnet walkthroughs use the RPC endpoints listed in their project READMEs. Read-only calls such as swap quotes require access to the endpoint. Testnet transactions require a wallet or CLI key funded with test INJ for gas, plus any tokens the walkthrough uses. Cross-chain demos also require access to the documented networks and routes.

### Run a local node with Docker

The published Docker image runs a local Injective chain with precompiles, native modules, and block production. The precompiles example, Foundry template, and Day 7 tutorial use this setup. Foundry and Hardhat run standard Solidity unit tests in simulated EVMs. Calls to Injective precompiles require an Injective node.

Install Docker with Compose and `jq`. To start the precompiles devnet, run these commands from the repository root.

```bash
make -C examples/precompiles local-init
make -C examples/precompiles local-start
```

`local-init` pulls the published `injectivelabs/injective-core:v1.21.0` image and initializes the chain. `local-start` starts the node and Blockscout. The EVM JSON-RPC is available at `http://localhost:8545`. The Foundry template includes the same workflow.

### Install the published binary

Install `injectived` on `PATH` for scripts that call the native CLI directly. ACME Bridge and LayerZero OFT use it for native token operations, while the full swap localnet demo uses it to initialize and run its own chain.

Download `linux-amd64.zip` for Linux x86_64 from Injective Foundation Releases. Use the version specified by the example. For public networks, match the active version on the Chain Portal and select a `-beta` release for Testnet. Check the archive against the published checksum when available. [Injective Foundation Releases](https://github.com/InjectiveFoundation/injective-core/releases) · [Chain Portal](https://chain.injective.network)

From the download directory, extract and install the CLI and its Wasm runtime library.

```bash
unzip linux-amd64.zip
sudo install -m 0755 injectived /usr/local/bin/injectived
sudo install -m 0644 libwasmvm.x86_64.so /usr/lib/libwasmvm.x86_64.so
injectived version
```

For commands that require a host binary, run the example in a supported Linux x86_64 environment. For interactive CLI use through Docker, see the [CLI tutorial](tutorials/n-days-of-injective/day05/injectived/README.md#with-docker).

## Templates

Starter projects for scaffolding new repositories.

| Template | Description | Chain access |
|----------|-------------|--------------|
| [`foundry`](templates/foundry) | Compile, test, deploy, and verify EVM smart contracts with Foundry | Published Docker image for local devnet or public Testnet RPC |
| [`hardhat`](templates/hardhat) | Compile, test, deploy, and verify EVM smart contracts with Hardhat | In-memory EVM for unit tests and public Testnet RPC for deployment |
| [`react`](templates/react) | React dApp with Injective smart contracts | Public Testnet RPC |

### Quick Start

```bash
# See available templates
make

# Create a new project from a template
make foundry ~/my-foundry-project
make hardhat ~/my-hardhat-project
make react ~/my-react-project
```

This copies the template to the specified path and initializes a fresh git repo, ready to work with.

#### Foundry

```bash
make foundry ~/my-project
cd ~/my-project
forge install foundry-rs/forge-std
forge build
forge test
```

#### Hardhat

```bash
make hardhat ~/my-project
cd ~/my-project
npm install
npx hardhat compile
npx hardhat test
```

#### React

```bash
make react ~/my-project
cd ~/my-project
npm install
npm run dev
```

## Demos & Examples

Reference implementations and demos.

| Example | Description | Chain access |
|---------|-------------|--------------|
| [`acme-bridge`](examples/acme-bridge) | Bridge an ERC-20 from Sepolia and create its Injective token pair | Public Testnet endpoints and published `injectived` binary |
| [`precompiles`](examples/precompiles) | Injective precompile interfaces and a Bank-backed ERC-20 example | Published Docker image for local devnet or public Testnet RPC |
| [`swap-precompile`](examples/swap-precompile) | Quote and execute exact-input and exact-output spot swaps | Public RPC or published `injectived` binary for the localnet demo |
| [`ibc-precompile`](examples/ibc-precompile) | Send ICS-20 transfers from the EVM and receive them with a Solidity hook | Public Testnet endpoints and an active IBC relayer |
| [`usdc`](examples/usdc) | USDC CCTP cross-chain transfer demo | Public Testnet endpoints |
| [`layerzero-oft`](examples/layerzero-oft) | LayerZero OFT to Solana with native and EVM token flows | Public Testnet endpoints and published `injectived` binary for native CLI steps |

## Tutorials

Step-by-step guided learning resources for developer onboarding.

| Tutorial | Description |
|----------|-------------|
| [`n-days-of-injective`](tutorials/n-days-of-injective) | Multi-day guided tutorial series for building on Injective |
