#!/usr/bin/env bash
set -euo pipefail

# Bridge ACME tokens from Ethereum Sepolia to Injective via Peggy.
#
# How it works:
#   1. Approve the Peggy contract to spend your ACME tokens
#   2. Call sendToInjective on Peggy with your token, destination, and amount
#   3. Peggo relayers (run by validators) detect the deposit and mint on Injective
#   4. Your tokens appear as peggy0x<ACME_ADDRESS> on Injective (~2 min)
#
# The destination address is your Ethereum address (0x...) padded to bytes32.
# This is NOT your inj1... address - it's the corresponding 0x address.
# Both addresses map to the same account on Injective.
#
# Requires: cast (Foundry), .env configured

source .env

if [ -z "${PRIVATE_KEY:-}" ]; then
  echo "Error: Set PRIVATE_KEY in .env"
  exit 1
fi

if [ -z "${ACME_ADDRESS:-}" ]; then
  echo "Error: Set ACME_ADDRESS in .env (the deployed ACME contract on Sepolia)"
  exit 1
fi

if [ -z "${WALLET_ADDRESS:-}" ]; then
  echo "Error: Set WALLET_ADDRESS in .env (your 0x address)"
  exit 1
fi

PEGGY_CONTRACT="${PEGGY_CONTRACT:-0x69A8b9F6e25b8D2550C3abc41E84929feaA2CBAF}"
BRIDGE_AMOUNT="${BRIDGE_AMOUNT:-1000000000000000000000}"
SEPOLIA_RPC_URL="${SEPOLIA_RPC_URL:-https://rpc.sepolia.org}"

# Pad the 0x wallet address to bytes32 for the Peggy contract
# 0x address is 20 bytes, needs to be left-padded to 32 bytes
DESTINATION=$(cast to-bytes32 "$WALLET_ADDRESS")

echo "=== Configuration ==="
echo "  ACME contract:  $ACME_ADDRESS"
echo "  Peggy contract: $PEGGY_CONTRACT"
echo "  Destination:    $WALLET_ADDRESS"
echo "  Destination32:  $DESTINATION"
echo "  Amount:         $BRIDGE_AMOUNT"
echo ""

echo "=== Step 1: Check ACME balance ==="
BALANCE=$(cast call "$ACME_ADDRESS" "balanceOf(address)(uint256)" "$WALLET_ADDRESS" --rpc-url "$SEPOLIA_RPC_URL")
echo "  Balance: $BALANCE"
echo ""

echo "=== Step 2: Approve Peggy contract to spend ACME ==="
cast send "$ACME_ADDRESS" \
  "approve(address,uint256)" \
  "$PEGGY_CONTRACT" \
  "$BRIDGE_AMOUNT" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$SEPOLIA_RPC_URL"
echo "  Approved."
echo ""

echo "=== Step 3: Bridge ACME to Injective via sendToInjective ==="
echo "  Calling sendToInjective(address,bytes32,uint256,string)..."
cast send "$PEGGY_CONTRACT" \
  "sendToInjective(address,bytes32,uint256,string)" \
  "$ACME_ADDRESS" \
  "$DESTINATION" \
  "$BRIDGE_AMOUNT" \
  "" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$SEPOLIA_RPC_URL"

echo ""
echo "=== Bridge transaction submitted ==="
echo ""
echo "  Wait ~2 minutes for Peggo relayers to process the deposit."
echo ""
echo "  Your Injective denom will be: peggy$ACME_ADDRESS"
echo ""
echo "  Verify your balance on Injective:"
echo "    curl -s 'https://testnet.sentry.lcd.injective.network:443/cosmos/bank/v1beta1/balances/${WALLET_ADDRESS}' \\"
echo "      | jq '.balances[] | select(.denom | contains(\"${ACME_ADDRESS:2}\"))'"
