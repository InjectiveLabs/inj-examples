# ACME Bridge: Deploy an ERC-20 on Ethereum, Bridge to Injective, Create MTS Token Pair

End-to-end example: deploy a token on Ethereum Sepolia, bridge it to Injective via Peggy, and make it accessible from both EVM (MetaMask, Solidity) and Native Execution Layer (bank module, exchange module) via the MultiVM Token Standard.

## What this covers

1. Deploy a simple ERC-20 (ACME) on Ethereum Sepolia
2. Bridge ACME to Injective testnet via the Peggy bridge
3. Create an MTS token pair so the token is visible on Injective's EVM
4. Set token metadata via a governance proposal
5. Verify cross-VM balance consistency

Everything uses CLI tools (`forge`, `cast`, `injectived`, `curl`). No UI dependencies.

```
Ethereum Sepolia                    Injective Testnet
+--------------+     Peggy        +---------------------------------+
| ACME ERC-20  | --------------> | peggy0x... (bank module denom)  |
| (deploy here)|    bridge        |         |                       |
+--------------+                  |    MTS token pair               |
                                  |         |                       |
                                  |    +----v----+                  |
                                  |    | ERC-20  |  <-- MetaMask    |
                                  |    | (0x...) |  <-- Solidity    |
                                  |    +---------+                  |
                                  +---------------------------------+
```

## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Foundry (forge, cast) | `forge --version` | [getfoundry.sh](https://getfoundry.sh) |
| injectived | `injectived version` | [GitHub releases](https://github.com/InjectiveFoundation/injective-core/releases) |
| jq | `jq --version` | `brew install jq` or [stedolan.github.io/jq](https://stedolan.github.io/jq/) |

You also need:
- Sepolia ETH from a [faucet](https://faucet.quicknode.com/ethereum/sepolia)
- Testnet INJ from the [Injective faucet](https://testnet.faucet.injective.network)

## Quick start

```bash
git clone https://github.com/InjectiveLabs/inj-examples
cd inj-examples/examples/acme-bridge

# Install Foundry dependencies
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit

# Configure
cp .env.example .env
# Edit .env: set PRIVATE_KEY and WALLET_ADDRESS

# Build and test
make build
make test
```

## Step 1: Deploy ACME on Sepolia

```bash
make deploy-sepolia
```

This deploys a simple ERC-20 with:
- Name: "ACME Token"
- Symbol: "ACME"
- Decimals: 18
- Initial supply: 1,000,000 ACME (minted to deployer)

Save the deployed contract address and update `ACME_ADDRESS` in `.env`.

Verify on Sepolia:
```bash
cast call $ACME_ADDRESS "name()(string)" --rpc-url $SEPOLIA_RPC_URL
cast call $ACME_ADDRESS "symbol()(string)" --rpc-url $SEPOLIA_RPC_URL
cast call $ACME_ADDRESS "totalSupply()(uint256)" --rpc-url $SEPOLIA_RPC_URL
```

## Step 2: Bridge to Injective via Peggy

Update `WALLET_ADDRESS` and `BRIDGE_AMOUNT` in `.env`, then:

```bash
make bridge
```

This runs two transactions using `cast`:

1. **Approve** the Peggy contract (`0x69A8b9F6e25b8D2550C3abc41E84929feaA2CBAF`) to spend your ACME
2. **sendToInjective** on the Peggy contract with:
   - `_tokenContract`: your ACME contract address
   - `_destination`: your wallet address padded to bytes32
   - `_amount`: the amount in wei
   - `_data`: empty string

Wait ~2 minutes for Peggo relayers to process the deposit.

Verify on Injective:
```bash
make check-injective
# Or manually:
curl -s "https://testnet.sentry.lcd.injective.network:443/cosmos/bank/v1beta1/balances/$INJ_ADDRESS" \
  | jq '.balances[] | select(.denom | contains("ACME_ADDRESS_WITHOUT_0x"))'
```

Your Injective denom is `peggy0x<YOUR_ACME_ADDRESS>`.

## Step 3: Create MTS token pair

First, import your private key into `injectived`:
```bash
injectived keys unsafe-import-eth-key acme-test
# Paste your hex private key when prompted, set a passphrase
```

Then:
```bash
make create-pair
```

This calls `injectived tx erc20 create-token-pair` which deploys a `FixedSupplyBankERC20` contract on Injective's EVM. The same token balance is now accessible from both Native Injective and EVM.

> **Gas requirement:** This command needs `--gas=3000000` minimum. The ERC20 module internally deploys an EVM contract with a hardcoded 2M gas limit. The script handles this automatically.

After the transaction succeeds, query the new ERC20 address:
```bash
curl -s "https://testnet.sentry.lcd.injective.network:443/injective/erc20/v1beta1/all_token_pairs" \
  | jq '.token_pairs[] | select(.bank_denom | contains("YOUR_ACME_ADDRESS"))'
```

Update `MTS_ERC20_ADDRESS` in `.env`.

## Step 4: Set token metadata

The auto-deployed ERC20 contract reads name, symbol, and decimals from the bank module's denom metadata. For Peggy-bridged tokens, this metadata is not set automatically. It requires a **governance proposal**.

1. Edit `scripts/metadata-proposal.json`: replace `0xYOUR_ACME_CONTRACT_ADDRESS` with your actual ACME contract address

2. Submit the proposal:
```bash
injectived tx gov submit-proposal scripts/metadata-proposal.json \
  --from=acme-test \
  --keyring-backend=file \
  --chain-id=injective-888 \
  --node=https://testnet.sentry.tm.injective.network:443 \
  --gas=auto --gas-adjustment=1.5 \
  --gas-prices=160000000inj \
  --yes
```

3. Coordinate with testnet validators to vote yes. Reach out on [Discord](https://discord.gg/injective) or the [Developer Telegram](https://t.me/+Nsy2KjGWtOE5NTY9).

Once the proposal passes, verify:
```bash
cast call $MTS_ERC20_ADDRESS "symbol()(string)" --rpc-url $RPC_URL
# Returns: "ACME"
cast call $MTS_ERC20_ADDRESS "decimals()(uint8)" --rpc-url $RPC_URL
# Returns: 18
```

> **Why is this needed?** The `create-token-pair` command for Peggy denoms deploys a contract that reads metadata from the bank module. The Peggy bridge doesn't carry over token name/symbol/decimals from Ethereum, so the metadata must be set separately. For TokenFactory denoms, the admin can call `MsgSetDenomMetadata` directly without a governance proposal.

## Step 5: Add to MetaMask

Add Injective EVM Testnet to MetaMask:

| Field | Value |
|-------|-------|
| Network name | Injective EVM Testnet |
| RPC URL | `https://k8s.testnet.json-rpc.injective.network/` |
| Chain ID | `1439` |
| Currency symbol | INJ |
| Block explorer | `https://testnet.blockscout.injective.network/` |

Then: **Manage tokens** > **Custom token** > paste your `MTS_ERC20_ADDRESS`.

## Step 6: Verify

```bash
make verify
```

This checks:
- ERC20 metadata (name, symbol, decimals) from the EVM side via `cast`
- Token balance from both EVM (`balanceOf`) and Native Injective (bank module REST)
- Both should return the same amount

## What's next

Once your token is live on Injective with MTS, you can:

- **Launch a spot market** on the native CLOB ([docs](https://docs.injective.network/developers-defi/market-launch))
- **Build lending or vault contracts** in Solidity using precompiles ([docs](https://docs.injective.network/developers-defi/defi-integration))
- **Set up oracle feeds** for off-chain price data ([docs](https://docs.injective.network/developers-defi/provider-oracle))
- **Add permissions** for compliance controls ([docs](https://docs.injective.network/developers-native/injective/permissions))
- **Submit to injective-lists** for display in Injective dApps ([contributing guide](https://github.com/InjectiveLabs/injective-lists/blob/master/CONTRIBUTING.md))

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `gas computation overflow/underflow` on create-pair | Set `--gas=3000000` minimum. The EVM contract deployment needs 2M gas internally. |
| Gas simulation returns wrong estimate | Known issue. Use `--gas=auto --gas-adjustment=1.5` or hardcode 3M. |
| Token pair created but name/symbol/decimals are blank | Expected for Peggy denoms. Submit the governance proposal in Step 4. |
| MetaMask shows 0 balance | Ensure you're on Injective EVM Testnet (chain ID 1439) and the token was bridged to the same address. |
| Bridge transaction pending | Peggo relayers typically process deposits within 2 minutes. Check the [testnet explorer](https://testnet.explorer.injective.network). |
| `token pair already exists` | Someone already created the pair. Query the existing pair for the ERC20 address. |
| `injectived keys` not finding your key | Use `--keyring-backend=file` on all commands. |

## Reference

| Resource | Link |
|----------|------|
| MultiVM Token Standard | https://docs.injective.network/developers-evm/multivm-token-standard |
| ERC20 Module (create-token-pair) | https://docs.injective.network/developers-evm/erc20-module |
| Peggy Bridge | https://docs.injective.network/developers-native/bridges/ethereum |
| Token Metadata | https://docs.injective.network/developers/assets/token-metadata |
| Testnet Proposals | https://docs.injective.network/developers/testnet-proposals |
| Testnet Resources | https://chain-portal.injective.network/testnet |
| Injective Faucet | https://testnet.faucet.injective.network |
| Blockscout (EVM Explorer) | https://testnet.blockscout.injective.network |
