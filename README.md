# Injective Examples

Templates, examples, and tutorials for building on Injective EVM.

## Templates

Starter projects you can scaffold into a new repo.

| Template | Description |
|----------|-------------|
| `foundry` | Compile, test, deploy, and verify EVM smart contracts with Foundry |
| `hardhat` | Compile, test, deploy, and verify EVM smart contracts with Hardhat |
| `react` | React dApp with Injective smart contracts |

### Quick Start

```bash
git clone https://github.com/InjectiveLabs/inj-examples.git
cd inj-examples

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

## Examples

Reference implementations and demos.

| Example | Description |
|---------|-------------|
| [`precompiles`](examples/precompiles) | Injective precompile integration — Bank ERC-20 token, all precompile interfaces |
| [`usdc`](examples/usdc) | USDC CCTP cross-chain transfer demo |

## Tutorials

Step-by-step guided learning resources.

| Tutorial | Description |
|----------|-------------|
| [`n-days-of-injective`](tutorials/n-days-of-injective) | Multi-day guided tutorial series for building on Injective |