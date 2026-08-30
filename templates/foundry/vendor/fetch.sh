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

# ── Add the contracts you need ────────────────────────────────────────────
#
# Available interfaces (precompile entry points):
#   Bank.sol              IBankModule      — precompile at 0x0000...0064
#   CosmosTypes.sol       Cosmos.Coin struct
#   Exchange.sol          IExchangeModule  — precompile at 0x0000...0065
#   ExchangeTypes.sol     Exchange structs
#   Staking.sol           IStakingModule   — precompile at 0x0000...0066
#   Oracle.sol            IOracleModule    — precompile at 0x0000...0067
#
# Available implementations (ready-to-use contracts):
#   BankERC20.sol             Abstract ERC-20 backed by Bank precompile
#   MintBurnBankERC20.sol     Owner-controlled mint/burn ERC-20
#   FixedSupplyBankERC20.sol  Fixed-supply ERC-20
#   BankERC20Upgradeable.sol  Upgradeable ERC-20
#   WINJ9.sol                 Wrapped INJ
#
# Populate the arrays below with the files you need, then run:
#   ./vendor/fetch.sh
#
# ──────────────────────────────────────────────────────────────────────────

INTERFACES=(
  # "Bank.sol"
  # "CosmosTypes.sol"
)

IMPLEMENTATIONS=(
  # "BankERC20.sol"
  # "MintBurnBankERC20.sol"
)

ALL_FILES=("${INTERFACES[@]}" "${IMPLEMENTATIONS[@]}")

if [ ${#ALL_FILES[@]} -eq 0 ]; then
  echo "No contracts configured. Edit vendor/fetch.sh to add the precompiles you need."
  echo "See the comments in the script for available contracts."
  exit 0
fi

# Clean and recreate
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

echo "Fetching from ${REPO}@${BRANCH}..."

if [ ${#INTERFACES[@]} -gt 0 ]; then
  echo ""
  echo "  Interfaces:"
  for file in "${INTERFACES[@]}"; do
    printf "    %-30s" "${file}"
    curl -sf "${BASE_URL}/${file}" -o "${VENDOR_DIR}/${file}" && echo "ok" || {
      echo "FAILED"
      exit 1
    }
  done
fi

if [ ${#IMPLEMENTATIONS[@]} -gt 0 ]; then
  echo ""
  echo "  Implementations:"
  for file in "${IMPLEMENTATIONS[@]}"; do
    printf "    %-30s" "${file}"
    curl -sf "${BASE_URL}/${file}" -o "${VENDOR_DIR}/${file}" && echo "ok" || {
      echo "FAILED"
      exit 1
    }
  done
fi

echo ""
echo "Vendored ${#ALL_FILES[@]} files to vendor/injective/"
echo ""
echo "Add '@injective/=vendor/injective/' to remappings in foundry.toml, then import:"
echo "  import {IBankModule} from \"@injective/Bank.sol\";"
echo ""
echo "ERC-20 implementations depend on OpenZeppelin. If not installed:"
echo "  forge install OpenZeppelin/openzeppelin-contracts"
