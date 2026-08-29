# Injective Examples

Templates and examples for building on Injective EVM.

## Templates

Starter projects you can scaffold into a new repo.

| Template | Description |
|----------|-------------|
| `foundry` | Compile, test, deploy, and verify EVM smart contracts with Foundry |
| `hardhat` | Compile, test, deploy, and verify EVM smart contracts with Hardhat |

### Quick Start

```bash
git clone https://github.com/InjectiveLabs/inj-examples.git
cd inj-examples

# See available templates
make

# Create a new project from a template
make foundry ~/my-foundry-project
make hardhat ~/my-hardhat-project
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

## Examples

Reference implementations and demos.

| Example | Description |
|---------|-------------|
| [`usdc`](examples/usdc) | USDC CCTP cross-chain transfer demo |