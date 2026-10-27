#!/usr/bin/env bash
set -euo pipefail

# Path A, step 1. One native transaction with three messages:
#   1. MsgCreateDenom     name, symbol and decimals set bank metadata up front (10 INJ fee)
#   2. MsgMint            CreateTokenPair rejects a denom with zero supply
#   3. MsgCreateTokenPair the chain deploys MintBurnBankERC20 owned by the deployer
#
# One transaction means there is no window where the denom exists without a pair.
# Gas is fixed at 3.5M: the template deploy inside CreateTokenPair is hardcoded
# at 2M and simulation underestimates it.
#
# Requires: injectived, jq, .env

source .env
: "${INJ_KEY_NAME:?Set INJ_KEY_NAME in .env}"
: "${INJ_ADDRESS:?Set INJ_ADDRESS in .env}"
: "${SUBDENOM:?Set SUBDENOM in .env}"
: "${TOKEN_NAME:?Set TOKEN_NAME in .env}"
: "${TOKEN_SYMBOL:?Set TOKEN_SYMBOL in .env}"
: "${TOKEN_DECIMALS:?Set TOKEN_DECIMALS in .env}"
: "${INITIAL_SUPPLY:?Set INITIAL_SUPPLY in .env}"

LCD_URL="${LCD_URL:-https://testnet.sentry.lcd.injective.network:443}"
TM_URL="${TM_URL:-https://testnet.sentry.tm.injective.network:443}"
CHAIN_ID="${CHAIN_ID:-injective-888}"
DENOM="factory/${INJ_ADDRESS}/${SUBDENOM}"
GAS=3500000
GAS_PRICE=160000000
FEE=$((GAS * GAS_PRICE))

COMMON=(--from "$INJ_KEY_NAME" --keyring-backend file --chain-id "$CHAIN_ID" --node "$TM_URL" --generate-only)

echo "=== Building atomic token tx ==="
echo "  Denom: $DENOM"

EXISTING=$(curl -s "$LCD_URL/injective/erc20/v1beta1/all_token_pairs" | jq -r ".token_pairs[] | select(.bank_denom == \"$DENOM\") | .erc20_address")
if [ -n "$EXISTING" ]; then
  echo "  Token pair already exists at $EXISTING"
  echo "  Set MTS_ERC20_ADDRESS=$EXISTING in .env"
  exit 0
fi

injectived tx tokenfactory create-denom "$SUBDENOM" "$TOKEN_NAME" "$TOKEN_SYMBOL" "$TOKEN_DECIMALS" "${COMMON[@]}" > tx-1.json
injectived tx tokenfactory mint "${INITIAL_SUPPLY}${DENOM}" "$INJ_ADDRESS" "${COMMON[@]}" > tx-2.json
injectived tx erc20 create-token-pair "$DENOM" "${COMMON[@]}" > tx-3.json

jq -s --arg gas "$GAS" --arg fee "$FEE" '
  .[0]
  | .body.messages = [.[0].body.messages[0], .[1].body.messages[0], .[2].body.messages[0]]
  | .auth_info.fee.gas_limit = $gas
  | .auth_info.fee.amount = [{"denom": "inj", "amount": $fee}]
' tx-1.json tx-2.json tx-3.json > tx-unsigned.json

injectived tx sign tx-unsigned.json \
  --from "$INJ_KEY_NAME" --keyring-backend file \
  --chain-id "$CHAIN_ID" --node "$TM_URL" > tx-signed.json

echo "=== Broadcasting ==="
injectived tx broadcast tx-signed.json --node "$TM_URL" --broadcast-mode sync

echo ""
echo "=== Waiting for the pair ==="
for _ in $(seq 1 20); do
  sleep 2
  ERC20=$(curl -s "$LCD_URL/injective/erc20/v1beta1/all_token_pairs" | jq -r ".token_pairs[] | select(.bank_denom == \"$DENOM\") | .erc20_address")
  if [ -n "$ERC20" ]; then
    echo "  ERC20 address: $ERC20"
    echo "  Set MTS_ERC20_ADDRESS=$ERC20 in .env, then run: make deploy-adapter"
    exit 0
  fi
done
echo "  Pair not visible yet. Query it with:"
echo "    curl -s '$LCD_URL/injective/erc20/v1beta1/all_token_pairs' | jq '.token_pairs[] | select(.bank_denom == \"$DENOM\")'"
