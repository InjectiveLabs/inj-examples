#!/usr/bin/env bash
set -euo pipefail

# Create an MTS token pair for a Peggy-bridged token on Injective testnet.
#
# What this does:
#   Deploys a FixedSupplyBankERC20 contract on Injective's EVM that maps to
#   the peggy denom in the bank module. After this, the same token balance
#   is accessible from both EVM (MetaMask, Solidity) and Native Injective.
#
# IMPORTANT: Requires --gas=3000000 minimum.
#   The ERC20 module internally deploys an EVM contract with a hardcoded
#   2M gas limit. Any Cosmos gas value below ~2.1M will fail with:
#   "gas computation overflow/underflow"
#
# For peggy denoms, anyone can create the pair (no admin needed).
# Custom ERC20 contracts are not supported for peggy denoms.
#
# Requires: injectived CLI, .env configured

source .env

if [ -z "${ACME_ADDRESS:-}" ]; then
  echo "Error: Set ACME_ADDRESS in .env"
  exit 1
fi

if [ -z "${INJ_KEY_NAME:-}" ]; then
  echo "Error: Set INJ_KEY_NAME in .env (your injectived key name)"
  exit 1
fi

PEGGY_DENOM="peggy${ACME_ADDRESS}"

echo "=== Creating MTS token pair ==="
echo "  Denom:    $PEGGY_DENOM"
echo "  Gas:      3000000 (minimum for ERC20 contract deployment)"
echo "  Chain ID: injective-888"
echo ""

# First check that the denom has supply on-chain
echo "=== Checking on-chain supply ==="
SUPPLY=$(curl -s "https://testnet.sentry.lcd.injective.network:443/cosmos/bank/v1beta1/supply/by_denom?denom=${PEGGY_DENOM}" | jq -r '.amount.amount // "0"')
if [ "$SUPPLY" = "0" ] || [ "$SUPPLY" = "null" ]; then
  echo "  Error: Denom $PEGGY_DENOM has no supply on-chain."
  echo "  Bridge tokens first using: make bridge"
  exit 1
fi
echo "  Supply: $SUPPLY"
echo ""

# Check if pair already exists
echo "=== Checking for existing token pair ==="
EXISTING=$(curl -s "https://testnet.sentry.lcd.injective.network:443/injective/erc20/v1beta1/all_token_pairs" | jq -r ".token_pairs[] | select(.bank_denom == \"${PEGGY_DENOM}\") | .erc20_address")
if [ -n "$EXISTING" ]; then
  echo "  Token pair already exists!"
  echo "  ERC20 address: $EXISTING"
  echo "  Update MTS_ERC20_ADDRESS=$EXISTING in .env"
  exit 0
fi
echo "  No existing pair found. Creating..."
echo ""

# Submit the transaction
injectived tx erc20 create-token-pair \
  "$PEGGY_DENOM" \
  --from="$INJ_KEY_NAME" \
  --keyring-backend=file \
  --chain-id=injective-888 \
  --node=https://testnet.sentry.tm.injective.network:443 \
  --gas=3000000 \
  --gas-prices=160000000inj \
  --yes

echo ""
echo "=== Token pair created ==="
echo ""
echo "  Query the ERC20 address:"
echo "    curl -s 'https://testnet.sentry.lcd.injective.network:443/injective/erc20/v1beta1/all_token_pairs' \\"
echo "      | jq '.token_pairs[] | select(.bank_denom | contains(\"${ACME_ADDRESS:2}\"))'"
echo ""
echo "  Then update MTS_ERC20_ADDRESS in .env with the erc20_address value."
