#!/bin/bash
#
# Initialize a local Injective chain for EVM development.
# Runs entirely inside Docker — no local injectived binary needed.
#
# Modified from injective-core/setup.sh: only chain init, EVM config, and funded accounts.
# Source: https://github.com/InjectiveLabs/injective-core/blob/master/setup.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATADIR="$SCRIPT_DIR/data"
INJHOME="$DATADIR/.injectived"
IMAGE="injectivelabs/injective-core:latest"

if [ -d "$INJHOME" ]; then
  echo "Chain data already exists at $INJHOME"
  echo "Run 'make local-clean' first to reset, or 'make local-start' to use existing data."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "Error: Docker not found. Install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

mkdir -p "$INJHOME"

echo "Pulling $IMAGE..."
docker pull "$IMAGE"

# Run all injectived commands inside the container, mounting the data directory.
# The container writes to /root/.injectived which maps to our local data dir.
injectived() {
  docker run --rm \
    -v "$INJHOME:/root/.injectived" \
    "$IMAGE" \
    injectived "$@" --home /root/.injectived
}

# Pipe-friendly version for commands that need stdin (passphrases, mnemonics)
injectived_stdin() {
  docker run --rm -i \
    -v "$INJHOME:/root/.injectived" \
    "$IMAGE" \
    injectived "$@" --home /root/.injectived
}

CHAINID="injective-1"
MONIKER="injective-local"
PASSPHRASE="12345678"

echo "Initializing local chain..."
injectived init $MONIKER --chain-id $CHAINID

# Fast block times for dev
if command -v perl &> /dev/null; then
  perl -i -pe 's/^timeout_commit = ".*?"/timeout_commit = "1000ms"/' "$INJHOME/config/config.toml"
  perl -i -pe 's/^minimum-gas-prices = ".*?"/minimum-gas-prices = "1inj"/' "$INJHOME/config/app.toml"
else
  sed -i'' -e 's/^timeout_commit = ".*"/timeout_commit = "1000ms"/' "$INJHOME/config/config.toml"
  sed -i'' -e 's/^minimum-gas-prices = ".*"/minimum-gas-prices = "1inj"/' "$INJHOME/config/app.toml"
fi

# Genesis config: denoms, EVM, gas
# Using Docker for jq since it may not be installed locally
GENESIS="$INJHOME/config/genesis.json"
update_genesis() {
  local tmp="$INJHOME/config/tmp_genesis.json"
  docker run --rm -v "$INJHOME:/data" -w /data mikefarah/yq:latest \
    sh -c "cat /data/config/genesis.json | jq '$1' > /data/config/tmp_genesis.json" 2>/dev/null \
  && mv "$tmp" "$GENESIS" \
  && return 0

  # Fallback: try local jq
  if command -v jq &> /dev/null; then
    cat "$GENESIS" | jq "$1" > "$tmp" && mv "$tmp" "$GENESIS"
  else
    echo "Error: jq not found locally and Docker jq fallback failed."
    echo "Install jq: https://jqlang.github.io/jq/download/"
    exit 1
  fi
}

update_genesis '.app_state["staking"]["params"]["bond_denom"]="inj"'
update_genesis '.app_state["crisis"]["constant_fee"]["denom"]="inj"'
update_genesis '.app_state["gov"]["params"]["min_deposit"][0]["denom"]="inj"'
update_genesis '.app_state["gov"]["params"]["voting_period"]="10s"'
update_genesis '.app_state["gov"]["params"]["expedited_voting_period"]="5s"'
update_genesis '.app_state["gov"]["params"]["expedited_min_deposit"][0]["denom"]="inj"'
update_genesis '.app_state["mint"]["params"]["mint_denom"]="inj"'

# Enable Cancun and Prague EVM from genesis
update_genesis '.app_state["evm"]["params"]["chain_config"]["cancun_time"]="0"'
update_genesis '.app_state["evm"]["params"]["chain_config"]["prague_time"]="0"'

# Block gas limit
update_genesis '.consensus["params"]["block"]["max_gas"]="150000000"'

# --- Accounts ---

echo "Creating accounts..."

# Validator/genesis account
yes $PASSPHRASE | injectived_stdin keys add genesis
GENESIS_ADDR=$(yes $PASSPHRASE | injectived_stdin keys show genesis -a 2>/dev/null | tail -1)
yes $PASSPHRASE | injectived_stdin add-genesis-account --chain-id $CHAINID "$GENESIS_ADDR" 1000000000000000000000000inj

# Dev account 1
DEV1_KEY="dev1"
DEV1_MNEMONIC="copper push brief egg scan entry inform record adjust fossil boss egg comic alien upon aspect dry avoid interest fury window hint race symptom"
printf '%s\n%s\n' "$DEV1_MNEMONIC" "$PASSPHRASE" | injectived_stdin keys add $DEV1_KEY --recover
DEV1_ADDR=$(yes $PASSPHRASE | injectived_stdin keys show $DEV1_KEY -a 2>/dev/null | tail -1)
yes $PASSPHRASE | injectived_stdin add-genesis-account --chain-id $CHAINID "$DEV1_ADDR" 1000000000000000000000000inj

# Dev account 2
DEV2_KEY="dev2"
DEV2_MNEMONIC="maximum display century economy unlock van census kite error heart snow filter midnight usage egg venture cash kick motor survey drastic edge muffin visual"
printf '%s\n%s\n' "$DEV2_MNEMONIC" "$PASSPHRASE" | injectived_stdin keys add $DEV2_KEY --recover
DEV2_ADDR=$(yes $PASSPHRASE | injectived_stdin keys show $DEV2_KEY -a 2>/dev/null | tail -1)
yes $PASSPHRASE | injectived_stdin add-genesis-account --chain-id $CHAINID "$DEV2_ADDR" 1000000000000000000000000inj

# Genesis transaction
echo "Signing genesis transaction..."
yes $PASSPHRASE | injectived_stdin genesis gentx genesis 1000000000000000000000inj --chain-id $CHAINID
yes $PASSPHRASE | injectived_stdin genesis collect-gentxs

echo "Validating genesis..."
injectived genesis validate

echo ""
echo "============================================"
echo "  Local chain initialized"
echo "============================================"
echo ""
echo "  Pre-funded dev accounts (1000 INJ each):"
echo ""
echo "  dev1:"
echo "    mnemonic: $DEV1_MNEMONIC"
echo "    EVM key:  cast wallet private-key --mnemonic \"$DEV1_MNEMONIC\""
echo ""
echo "  dev2:"
echo "    mnemonic: $DEV2_MNEMONIC"
echo "    EVM key:  cast wallet private-key --mnemonic \"$DEV2_MNEMONIC\""
echo ""
echo "  Run 'make local-start' to start the node."
echo ""