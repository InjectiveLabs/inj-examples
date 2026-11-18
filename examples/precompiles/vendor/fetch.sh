#!/bin/bash
#
# Fetch Injective precompile contracts from InjectiveLabs/solidity-contracts.
#
# Why vendor instead of `forge install`?
# The solidity-contracts repo is a development monorepo with transitive dependencies
# that break Foundry's build when installed as a submodule. Until a standalone
# interfaces package is published, we fetch only the files needed.
#
# Source: https://github.com/InjectiveLabs/solidity-contracts
#
set -e

REPO="InjectiveLabs/solidity-contracts"
REF="${SOLIDITY_CONTRACTS_REF:-v1.21.0-rc.1}"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${REF}/src"
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)/injective"

# All native Injective precompile interfaces
INTERFACES=(
  "Bank.sol"              # IBankModule      - precompile at 0x0000...0064
  "CosmosTypes.sol"       # Cosmos.Coin struct (shared dependency)
  "Exchange.sol"          # IExchangeModule  - precompile at 0x0000...0065
  "ExchangeTypes.sol"     # Exchange structs (shared dependency)
  "Staking.sol"           # IStakingModule   - precompile at 0x0000...0066
  "Oracle.sol"            # IOracleModule    - precompile at 0x0000...0067
  "IBC.sol"               # IIBCModule       - precompile at 0x0000...0069
)

# Bank precompile ERC-20 implementations
IMPLEMENTATIONS=(
  "BankERC20.sol"             # Abstract ERC-20 backed by Bank precompile
  "MintBurnBankERC20.sol"     # Owner-controlled mint/burn ERC-20
)

ALL_FILES=("${INTERFACES[@]}" "${IMPLEMENTATIONS[@]}")

# Download all upstream files before updating the vendored copy.
# Swap.sol is kept locally in sync with the focused swap example.
STAGING_DIR="$(mktemp -d)"
trap 'rm -r "$STAGING_DIR"' EXIT

echo "Fetching from ${REPO}@${REF}..."
for file in "${ALL_FILES[@]}"; do
  curl -fsS "${BASE_URL}/${file}" -o "${STAGING_DIR}/${file}"
done

mkdir -p "$VENDOR_DIR"
for file in "${ALL_FILES[@]}"; do
  cp "${STAGING_DIR}/${file}" "${VENDOR_DIR}/${file}"
done
echo "Vendored ${#ALL_FILES[@]} files to vendor/injective/"
