#!/usr/bin/env bash
set -euo pipefail

# Verify the MTS token pair is working: check ERC20 metadata and cross-VM balance consistency.

source .env

if [ -z "$MTS_ERC20_ADDRESS" ] || [ -z "$WALLET_ADDRESS" ] || [ -z "$INJ_ADDRESS" ]; then
  echo "Error: Set MTS_ERC20_ADDRESS, WALLET_ADDRESS, and INJ_ADDRESS in .env"
  exit 1
fi

PEGGY_DENOM="peggy${ACME_ADDRESS}"

echo "=== ERC20 Metadata (EVM side) ==="
echo -n "  name:     "
cast call "$MTS_ERC20_ADDRESS" "name()(string)" --rpc-url "$RPC_URL"
echo -n "  symbol:   "
cast call "$MTS_ERC20_ADDRESS" "symbol()(string)" --rpc-url "$RPC_URL"
echo -n "  decimals: "
cast call "$MTS_ERC20_ADDRESS" "decimals()(uint8)" --rpc-url "$RPC_URL"

echo ""
echo "=== EVM Balance ==="
echo -n "  "
cast call "$MTS_ERC20_ADDRESS" "balanceOf(address)(uint256)" "$WALLET_ADDRESS" --rpc-url "$RPC_URL"

echo ""
echo "=== Cosmos Balance ==="
curl -s "https://testnet.sentry.lcd.injective.network:443/cosmos/bank/v1beta1/balances/$INJ_ADDRESS" \
  | jq ".balances[] | select(.denom == \"$PEGGY_DENOM\")"

echo ""
echo "Note: If name/symbol are blank and decimals is 0, you need to set"
echo "bank denom metadata via a governance proposal. See scripts/metadata-proposal.json"
