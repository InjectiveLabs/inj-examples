#!/usr/bin/env bash
set -euo pipefail

# The one check that matters for an MTS token: the EVM view and the bank module
# report the same supply. For Path A the adapter's locked balance should equal
# the supply minted on Solana. For Path B bank supply moves with every transfer.

source .env
RPC_URL="${RPC_URL:-https://k8s.testnet.json-rpc.injective.network/}"
LCD_URL="${LCD_URL:-https://testnet.sentry.lcd.injective.network:443}"

if [ -n "${MTS_ERC20_ADDRESS:-}" ]; then
  TOKEN="$MTS_ERC20_ADDRESS"
  DENOM="factory/${INJ_ADDRESS}/${SUBDENOM}"
  MODE="Path A (adapter)"
else
  : "${OAPP_ADDRESS:?Set OAPP_ADDRESS (Path B) or MTS_ERC20_ADDRESS (Path A) in .env}"
  TOKEN="$OAPP_ADDRESS"
  DENOM="erc20:$(echo "$OAPP_ADDRESS" | tr 'A-Z' 'a-z')"
  MODE="Path B (OFT is the token)"
fi

echo "=== $MODE ==="
echo "  token:  $TOKEN"
echo "  denom:  $DENOM"
echo ""
echo "=== Metadata (EVM view of bank metadata) ==="
echo -n "  name:     "; cast call "$TOKEN" "name()(string)" --rpc-url "$RPC_URL"
echo -n "  symbol:   "; cast call "$TOKEN" "symbol()(string)" --rpc-url "$RPC_URL"
echo -n "  decimals: "; cast call "$TOKEN" "decimals()(uint8)" --rpc-url "$RPC_URL"
echo ""
echo "=== Supply (these two must match, otherwise the token is not MTS) ==="
echo -n "  EVM totalSupply: "; cast call "$TOKEN" "totalSupply()(uint256)" --rpc-url "$RPC_URL"
echo -n "  bank supply:     "; curl -s "$LCD_URL/cosmos/bank/v1beta1/supply/by_denom?denom=$DENOM" | jq -r '.amount.amount // "0"'

if [ -n "${OAPP_ADDRESS:-}" ] && [ -n "${MTS_ERC20_ADDRESS:-}" ]; then
  echo ""
  echo "=== Adapter locked balance (equals Solana supply, scaled by decimals) ==="
  echo -n "  EVM view:  "; cast call "$TOKEN" "balanceOf(address)(uint256)" "$OAPP_ADDRESS" --rpc-url "$RPC_URL"
  ADAPTER_INJ=$(injectived keys parse "${OAPP_ADDRESS#0x}" --output json 2>/dev/null | jq -r '.formats[0]' || true)
  if [ -n "$ADAPTER_INJ" ]; then
    echo -n "  bank view: "; curl -s "$LCD_URL/cosmos/bank/v1beta1/balances/$ADAPTER_INJ/by_denom?denom=$DENOM" | jq -r '.balance.amount // "0"'
  fi
fi
