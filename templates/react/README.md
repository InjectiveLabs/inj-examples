<div align="center">
  <img src="./frontend/public/logo.jpg" alt="Logo" width="120" style="border-radius:16px" />

  <h1>Injective dApp React Template</h1>

  <p>A minimal React starter for building dApps on Injective EVM Testnet.</p>

  <p>
    <strong>Stack:</strong> Vite · React 18 · TypeScript · Tailwind CSS · wagmi v2
  </p>

  <p>
    <a href="https://docs.injective.network/developers-evm/network-information">Docs</a> ·
    <a href="https://testnet.blockscout.injective.network/">Testnet Explorer</a> ·
    <a href="https://testnet.faucet.injective.network/">Faucet</a>
  </p>
</div>

---

## 🚀 Quick Start

**Clone and run:**

```bash
# Clone this template
git clone https://github.com/injective-dev/dapp-react-temp.git my-dapp
cd my-dapp/frontend

# Install dependencies
npm install

# Set up environment (vault address is already deployed!)
cp .env.example .env

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you're ready to go!

---

## 📦 What's Included

### USDC Vault Contract (Already Deployed!)

A simple custodial vault on **Injective EVM Testnet**:

- ✅ **Deposit USDC** — users deposit Circle USDC into the vault
- ✅ **Withdraw USDC** — users can withdraw their own funds at any time
- ✅ **View balance** — see total USDC held by the vault

**Deployed Contract:**
- **Address:** `0xc79efba3814eedb4b8b85651bc6668198e46ac5a`
- **Network:** Injective EVM Testnet (Chain ID: 1439)
- **Explorer:** [View on Blockscout](https://testnet.blockscout.injective.network/address/0xc79efba3814eedb4b8b85651bc6668198e46ac5a)

### Frontend Features

- **Wallet connection** — MetaMask, WalletConnect, Coinbase Wallet via wagmi
- **Network detection** — auto-detects Injective Testnet
- **Deposit/Withdraw UI** — simple forms for vault interactions
- **Real-time balance** — shows wallet balance, deposited balance, and total vault balance
- **Transaction history** — track your deposits and withdrawals

---

## 🛠 Project Structure

```
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # VaultForm, ConnectWallet, etc.
│   │   ├── config/         # wagmi + contract ABIs
│   │   ├── hooks/          # useWallet, useUSDCVault
│   │   └── pages/          # Home, Dashboard
│   └── .env.example        # Environment template
│
├── contracts/              # Solidity contracts (reference only)
│   └── contracts/USDCVault.sol
│
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

Create `frontend/.env`:

```bash
# USDC Vault address (already deployed on testnet)
VITE_VAULT_ADDRESS=0xc79efba3814eedb4b8b85651bc6668198e46ac5a

# Optional: override default USDC address
# VITE_USDC_ADDRESS=0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d
```

The vault contract is **already deployed** — you don't need to deploy anything yourself!

---

## 💳 Get Testnet Tokens

### 1. Get INJ (for gas)

Visit the [Injective Testnet Faucet](https://testnet.faucet.injective.network/):

1. Connect your wallet
2. Request testnet INJ
3. Wait ~30 seconds

### 2. Get USDC (Circle testnet USDC)

Visit [faucet.circle.com](https://faucet.circle.com/):

1. Select **Injective Testnet**
2. Enter your wallet address
3. Receive 10 testnet USDC

---

## 📖 How It Works

### Deposit Flow

1. User approves the vault to spend USDC (one-time)
2. User enters deposit amount
3. Contract transfers USDC from user to vault
4. Balance updates instantly

### Withdraw Flow

1. User enters withdrawal amount (up to their deposited balance)
2. Contract transfers USDC back to user
3. Balance updates instantly

**No admin fees, no lock-up period** — users have full control over their funds.

---

## 🌐 Network Details

| | Testnet |
|---|---|
| **Chain ID** | `1439` |
| **RPC** | `https://k8s.testnet.json-rpc.injective.network/` |
| **Explorer** | [testnet.blockscout.injective.network](https://testnet.blockscout.injective.network/) |
| **USDC Contract** | `0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d` |
| **Vault Contract** | `0xc79efba3814eedb4b8b85651bc6668198e46ac5a` |

---

## 🧪 Smart Contract (Reference)

The vault contract source is in `contracts/contracts/USDCVault.sol`.

**Key functions:**

```solidity
function deposit(uint256 amount) external;
function withdraw(uint256 amount) external;
function withdrawAll() external;
function getVaultBalance() external view returns (uint256);
function getUserDeposit(address user) external view returns (uint256);
```

**Security features:**

- ✅ ReentrancyGuard on all state-changing functions
- ✅ SafeERC20 for token transfers
- ✅ No admin/owner — fully permissionless
- ✅ Users can only withdraw their own funds

---

## 🤖 MCP Integration (Optional)

This template includes MCP (Model Context Protocol) integration for AI-powered on-chain operations.

Use Claude, Cursor, or VS Code to interact with Injective using natural language:

```
"Check my USDC balance"
"Deposit 5 USDC into the vault"
"What's the total vault balance?"
```

See [mcp/README.md](./mcp/README.md) for setup instructions.

---

## 🚢 Deployment (Advanced)

The vault contract is **already deployed** for you. If you want to deploy your own version:

```bash
cd contracts
npm install

# Deploy (needs a funded wallet — add PRIVATE_KEY to contracts/.env)
npx hardhat run scripts/deploy.ts --network injectiveTestnet
```

---

## 📚 Learn More

- [Injective EVM Docs](https://docs.injective.network/developers-evm/)
- [USDC on Injective](https://docs.injective.network/developers-defi/usdc-stablecoin)
- [wagmi Documentation](https://wagmi.sh/)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📄 License

MIT

---

<div align="center">
  <p>Built with ❤️ for Injective</p>
  <p>
    <a href="https://discord.gg/injective">Discord</a> ·
    <a href="https://twitter.com/InjectiveLabs">Twitter</a> ·
    <a href="https://github.com/InjectiveLabs">GitHub</a>
  </p>
</div>
