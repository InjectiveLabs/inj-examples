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
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/src"
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)/injective"

# All native Injective precompile interfaces
INTERFACES=(
  "Bank.sol"              # IBankModule      — precompile at 0x0000...0064
  "CosmosTypes.sol"       # Cosmos.Coin struct (shared dependency)
  "Exchange.sol"          # IExchangeModule  — precompile at 0x0000...0065
  "ExchangeTypes.sol"     # Exchange structs (shared dependency)
  "Staking.sol"           # IStakingModule   — precompile at 0x0000...0066
  "Oracle.sol"            # IOracleModule    — precompile at 0x0000...0067
)

# Bank precompile ERC-20 implementations
IMPLEMENTATIONS=(
  "BankERC20.sol"             # Abstract ERC-20 backed by Bank precompile
  "MintBurnBankERC20.sol"     # Owner-controlled mint/burn ERC-20
)

ALL_FILES=("${INTERFACES[@]}" "${IMPLEMENTATIONS[@]}")

# Clean and recreate
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

echo "Fetching from ${REPO}@${BRANCH}..."

echo ""
echo "  Interfaces:"
for file in "${INTERFACES[@]}"; do
  printf "    %-30s" "${file}"
  curl -sf "${BASE_URL}/${file}" -o "${VENDOR_DIR}/${file}" && echo "ok" || {
    echo "FAILED"
    exit 1
  }
done

echo ""
echo "  Implementations:"
for file in "${IMPLEMENTATIONS[@]}"; do
  printf "    %-30s" "${file}"
  curl -sf "${BASE_URL}/${file}" -o "${VENDOR_DIR}/${file}" && echo "ok" || {
    echo "FAILED"
    exit 1
  }
done

echo ""
echo "Vendored ${#ALL_FILES[@]} files to vendor/injective/"
