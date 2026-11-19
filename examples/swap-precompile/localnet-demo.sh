#!/bin/bash
#
# End-to-end swap precompile demo on a fresh localnet:
# chain init -> USDC token -> ERC20 pair -> spot market -> allowlist -> liquidity -> swap via 0x68.
#
# Requirements: injectived (v1.20.4+), cast (Foundry), python3.
# Usage: [SWAP_API_VERSION=2] ./localnet-demo.sh [new_home_dir]
set -euo pipefail

SWAP_API_VERSION="${SWAP_API_VERSION:-1}"
case "$SWAP_API_VERSION" in
  1|2) ;;
  *) echo "SWAP_API_VERSION must be 1 or 2" >&2; exit 1 ;;
esac

if [ "$#" -eq 0 ]; then
  HOME_DIR=$(mktemp -d "${TMPDIR:-/tmp}/injective-swap-demo.XXXXXX")
else
  HOME_DIR="$1"
  mkdir "$HOME_DIR"
fi
CHAIN_ID="injective-1"
KR=(--keyring-backend test --home "$HOME_DIR")
TXF="--chain-id $CHAIN_ID --gas-prices 160000000inj --yes --broadcast-mode sync"
EVM_RPC="http://127.0.0.1:8545"
SWAP_PRECOMPILE="0x0000000000000000000000000000000000000068"

log() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }

# Broadcast, wait for inclusion, and fail loudly on a non-zero deliver code.
tx() {
  local desc="$1"; shift
  local out hash code
  out=$("$@" 2>&1) || { echo "BROADCAST FAILED: $desc"; echo "$out" | head -3; exit 1; }
  code=$(echo "$out" | grep -m1 '^code:' | awk '{print $2}')
  [ "$code" = "0" ] || { echo "CHECKTX FAILED ($code): $desc"; echo "$out" | grep raw_log; exit 1; }
  hash=$(echo "$out" | grep -m1 txhash | awk '{print $2}')
  sleep 3
  code=$(injectived q tx "$hash" --chain-id $CHAIN_ID --home "$HOME_DIR" --output json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["code"])')
  [ "$code" = "0" ] || { echo "DELIVER FAILED ($code): $desc"; injectived q tx "$hash" --chain-id $CHAIN_ID --home "$HOME_DIR" --output json | python3 -c 'import json,sys; print(json.load(sys.stdin)["raw_log"][:300])'; exit 1; }
  echo "ok: $desc"
}

log "1. Fresh chain init"
echo "Localnet home: $HOME_DIR"
injectived init swap-demo --chain-id $CHAIN_ID --home "$HOME_DIR" > /dev/null 2>&1
injectived keys add dev1 "${KR[@]}" > /dev/null 2>&1
injectived keys add dev2 "${KR[@]}" > /dev/null 2>&1
injectived keys add val "${KR[@]}" > /dev/null 2>&1
DEV1=$(injectived keys show dev1 -a "${KR[@]}")
DEV2=$(injectived keys show dev2 -a "${KR[@]}")
echo "dev1 (exchange admin + swapper): $DEV1"
echo "dev2 (liquidity provider):       $DEV2"

log "2. Genesis: denoms, fast blocks, dev1 as exchange admin"
python3 - "$HOME_DIR/config/genesis.json" "$DEV1" << 'PYEOF'
import json, sys
path, dev1 = sys.argv[1], sys.argv[2]
g = json.load(open(path)); a = g["app_state"]
a["staking"]["params"]["bond_denom"] = "inj"
a["crisis"]["constant_fee"]["denom"] = "inj"
a["mint"]["params"]["mint_denom"] = "inj"
a["gov"]["params"]["min_deposit"][0]["denom"] = "inj"
a["gov"]["params"]["voting_period"] = "10s"
a["gov"]["params"]["expedited_voting_period"] = "5s"
a["gov"]["params"]["expedited_min_deposit"][0]["denom"] = "inj"
# The line that makes the allowlist manageable without governance:
a["exchange"]["params"]["exchange_admins"] = [dev1]
# Disable the post-genesis post-only window so swaps work immediately
a["exchange"]["params"]["post_only_mode_height_threshold"] = "0"
a["exchange"]["params"]["post_only_mode_blocks_amount"] = "1"
a["exchange"]["params"]["post_only_mode_blocks_amount_after_downtime"] = "1"
a["evm"]["params"]["chain_config"]["cancun_time"] = "0"
a["evm"]["params"]["chain_config"]["prague_time"] = "0"
g["consensus"]["params"]["block"]["max_gas"] = "150000000"
json.dump(g, open(path, "w"))
PYEOF
perl -i -pe 's/^timeout_commit = ".*?"/timeout_commit = "1000ms"/' "$HOME_DIR/config/config.toml"
perl -i -pe 's/^minimum-gas-prices = ".*?"/minimum-gas-prices = "1inj"/' "$HOME_DIR/config/app.toml"
for k in dev1 dev2 val; do
  injectived genesis add-genesis-account "$(injectived keys show $k -a "${KR[@]}")" 1000000000000000000000000inj --chain-id $CHAIN_ID --home "$HOME_DIR" > /dev/null
done
injectived genesis gentx val 1000000000000000000000inj --chain-id $CHAIN_ID "${KR[@]}" > /dev/null 2>&1
injectived genesis collect-gentxs --home "$HOME_DIR" > /dev/null 2>&1

log "3. Start node"
nohup injectived start --home "$HOME_DIR" \
  --rpc.laddr "tcp://127.0.0.1:26657" \
  --json-rpc.enable=true --json-rpc.address "127.0.0.1:8545" \
  --json-rpc.api "eth,web3,net,txpool" --json-rpc.allow-unprotected-txs=true \
  --grpc.address "127.0.0.1:9900" --log-level warn > "$HOME_DIR/node.log" 2>&1 &
NODE_PID=$!
trap 'kill "$NODE_PID" 2>/dev/null || true' EXIT
sleep 12
kill -0 "$NODE_PID" 2>/dev/null || { cat "$HOME_DIR/node.log" >&2; exit 1; }
H=$(curl -s -m 5 http://127.0.0.1:26657/status | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["sync_info"]["latest_block_height"])')
echo "node producing, height $H"

log "4. Create USDC (tokenfactory), mint, fund the liquidity provider"
DENOM="factory/$DEV1/usdc"
tx "create-denom" injectived tx tokenfactory create-denom usdc "Demo USDC" USDC 6 --from dev1 --gas 2000000 "${KR[@]}" $TXF
tx "mint 1,000,000 USDC" injectived tx tokenfactory mint "1000000000000$DENOM" "$DEV1" --from dev1 --gas 2000000 "${KR[@]}" $TXF
tx "fund dev2 with 400k USDC" injectived tx bank send dev1 "$DEV2" "400000000000$DENOM" --from dev1 --gas 400000 "${KR[@]}" $TXF

log "5. ERC20 token pair for USDC (MultiVM Token Standard)"
tx "create-token-pair" injectived tx erc20 create-token-pair "$DENOM" --from dev1 --gas 3000000 "${KR[@]}" $TXF
USDC_ERC20=$(injectived q erc20 token-pair-by-denom "$DENOM" --chain-id $CHAIN_ID --home "$HOME_DIR" --output json | python3 -c 'import json,sys; print(json.load(sys.stdin)["token_pair"]["erc20_address"])')
echo "USDC ERC20: $USDC_ERC20"

log "6. Launch INJ/USDC spot market (instant launch, 20 INJ fee)"
tx "instant-spot-market-launch" injectived tx exchange instant-spot-market-launch INJ/USDC inj "$DENOM" \
  --min-price-tick-size=0.001 --min-quantity-tick-size=0.001 \
  --min-notional=1 --base-decimals=18 --quote-decimals=6 --from dev1 --gas 3000000 "${KR[@]}" $TXF
MKT=$(injectived q exchange spot-markets --chain-id $CHAIN_ID --home "$HOME_DIR" --output json | python3 -c 'import json,sys; m=json.load(sys.stdin)["markets"][0]; m=m.get("market",m); print(m["market_id"])')
echo "market id: $MKT"

log "7. Allowlist the market: MsgUpdateSwapParams from the exchange admin"
cat > "$HOME_DIR/swap-params-tx.json" << TXEOF
{
  "body": {
    "messages": [
      { "@type": "/injective.exchange.v2.MsgUpdateSwapParams",
        "sender": "$DEV1",
        "swap_params": { "enabled": true, "allowed_markets": ["$MKT"] } }
    ],
    "memo": "", "timeout_height": "0", "extension_options": [], "non_critical_extension_options": []
  },
  "auth_info": { "signer_infos": [],
    "fee": { "amount": [{ "denom": "inj", "amount": "200000000000000" }], "gas_limit": "400000", "payer": "", "granter": "" } },
  "signatures": []
}
TXEOF
injectived tx sign "$HOME_DIR/swap-params-tx.json" --from dev1 --chain-id $CHAIN_ID "${KR[@]}" > "$HOME_DIR/swap-params-signed.json" 2>/dev/null
tx "MsgUpdateSwapParams" injectived tx broadcast "$HOME_DIR/swap-params-signed.json" --home "$HOME_DIR" --chain-id $CHAIN_ID --broadcast-mode sync

log "8. Liquidity: dev2 places a limit sell of 100 INJ at 10 USDC"
tx "limit sell order" injectived tx exchange create-spot-limit-order sell INJ/USDC 100 10 demo_sell_1 --from dev2 --gas 2000000 "${KR[@]}" $TXF

log "9. Swap 50 USDC -> INJ through the precompile (as dev1, via cast)"
DEV1_PK=$( (yes 12345678 2>/dev/null || true) | injectived keys unsafe-export-eth-key dev1 "${KR[@]}" 2>/dev/null | tail -1)
DEV1_EVM=$(cast wallet address --private-key "0x$DEV1_PK")
echo "dev1 EVM address: $DEV1_EVM"
QUOTE_SIG="quoteExactInputV1(address,string,uint256)(uint256)"
SWAP_SIG="swapExactInputV1(address,string,uint256,uint256,address,uint256)(uint256)"
if [ "$SWAP_API_VERSION" = 2 ]; then
  QUOTE_SIG="quoteExactInputV2(address,string,uint256)(uint256,uint256)"
  SWAP_SIG="swapExactInputV2(address,string,uint256,uint256,address,uint256)(uint256,uint256)"
fi
QUOTE=$(cast call "$SWAP_PRECOMPILE" "$QUOTE_SIG" "$USDC_ERC20" "$MKT" 50000000 --rpc-url "$EVM_RPC")
if [ "$SWAP_API_VERSION" = 2 ]; then
  echo "projected USDC base units spent: $(awk 'NR == 1 {print $1}' <<< "$QUOTE")"
fi
QUOTED=$(awk 'END {print $1}' <<< "$QUOTE")
echo "quote: 50 USDC -> $QUOTED INJ-wei"
MINOUT=$(python3 -c "print(int('$QUOTED') * 99 // 100)")
DEADLINE=$(python3 -c "import time; print(int(time.time()) + 300)")
BEFORE=$(injectived q bank balances "$DEV1" --home "$HOME_DIR" --output json | python3 -c 'import json,sys; print({b["denom"]: b["amount"] for b in json.load(sys.stdin)["balances"]}.get("inj"))')
cast send "$SWAP_PRECOMPILE" "$SWAP_SIG" \
  "$USDC_ERC20" "$MKT" 50000000 "$MINOUT" "$DEV1_EVM" "$DEADLINE" \
  --private-key "0x$DEV1_PK" --rpc-url $EVM_RPC --gas-limit 2000000 > /dev/null
sleep 3
AFTER=$(injectived q bank balances "$DEV1" --home "$HOME_DIR" --output json | python3 -c 'import json,sys; print({b["denom"]: b["amount"] for b in json.load(sys.stdin)["balances"]}.get("inj"))')

log "RESULT"
python3 -c "
before, after = int('$BEFORE'), int('$AFTER')
print(f'dev1 INJ before: {before}')
print(f'dev1 INJ after:  {after}')
print(f'received about {(after - before) / 1e18:.4f} INJ for 50 USDC (minus EVM gas)')"

if [ "$SWAP_API_VERSION" = 2 ]; then
  log "10. Quote and execute a swap for at least 1 INJ"
  NATIVE_INJ="0x0000000000000000000000000000000000000000"
  AMOUNT_OUT=1000000000000000000
  QUOTE=$(cast call "$SWAP_PRECOMPILE" 'quoteExactOutputV1(address,string,uint256)(uint256)' \
    "$NATIVE_INJ" "$MKT" "$AMOUNT_OUT" --rpc-url "$EVM_RPC")
  MAX_AMOUNT_IN=$(awk '{print $1}' <<< "$QUOTE")
  DEADLINE=$(python3 -c "import time; print(int(time.time()) + 300)")
  cast send "$SWAP_PRECOMPILE" 'swapExactOutputV1(address,string,uint256,uint256,address,uint256)' \
    "$NATIVE_INJ" "$MKT" "$AMOUNT_OUT" "$MAX_AMOUNT_IN" "$DEV1_EVM" "$DEADLINE" \
    --private-key "0x$DEV1_PK" --rpc-url "$EVM_RPC" --gas-limit 2000000
fi
echo
echo "Swap executed against the orderbook through the precompile. Demo complete."
