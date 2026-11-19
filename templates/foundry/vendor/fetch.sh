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

# ── Add the contracts you need ────────────────────────────────────────────
#
# Available interfaces (precompile entry points):
#   Bank.sol              IBankModule      — precompile at 0x0000...0064
#   CosmosTypes.sol       Cosmos.Coin struct
#   Exchange.sol          IExchangeModule  — precompile at 0x0000...0065
#   ExchangeTypes.sol     Exchange structs
#   Staking.sol           IStakingModule   — precompile at 0x0000...0066
#   Oracle.sol            IOracleModule    — precompile at 0x0000...0067
#   Swap.sol              ISwapModule      — precompile at 0x0000...0068, supplied by the scaffold
#   IBC.sol               IIBCModule       — precompile at 0x0000...0069
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
  "IBC.sol"
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

# Download all requested files before updating the vendored copy.
STAGING_DIR="$(mktemp -d)"
trap 'rm -r "$STAGING_DIR"' EXIT

echo "Fetching from ${REPO}@${REF}..."

if [ ${#INTERFACES[@]} -gt 0 ]; then
  echo ""
  echo "  Interfaces:"
  for file in "${INTERFACES[@]}"; do
    printf "    %-30s" "${file}"
    curl -sf "${BASE_URL}/${file}" -o "${STAGING_DIR}/${file}" && echo "ok" || {
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
    curl -sf "${BASE_URL}/${file}" -o "${STAGING_DIR}/${file}" && echo "ok" || {
      echo "FAILED"
      exit 1
    }
  done
fi

echo ""
mkdir -p "$VENDOR_DIR"
for file in "${ALL_FILES[@]}"; do
  cp "${STAGING_DIR}/${file}" "${VENDOR_DIR}/${file}"
done
echo "Vendored ${#ALL_FILES[@]} files to vendor/injective/"
echo ""
echo "ERC-20 implementations depend on OpenZeppelin. If not installed:"
echo "  forge install OpenZeppelin/openzeppelin-contracts"
