-include .env
export

SEPOLIA_RPC_URL   ?= https://rpc.sepolia.org
RPC_URL           ?= https://k8s.testnet.json-rpc.injective.network/
GAS_PRICE         ?= 160000000

.PHONY: help build test deploy-sepolia check-balance bridge create-pair verify

help:
	@echo ""
	@echo "  Build & Test"
	@echo "    make build              Compile ACME contract"
	@echo "    make test               Run test suite"
	@echo ""
	@echo "  Deploy (Sepolia)"
	@echo "    make deploy-sepolia     Deploy ACME ERC-20 on Ethereum Sepolia"
	@echo "    make check-balance      Check ACME balance on Sepolia"
	@echo ""
	@echo "  Bridge & MTS (Injective Testnet)"
	@echo "    make bridge             Approve Peggy + bridge ACME to Injective"
	@echo "    make check-injective    Check ACME balance on Injective"
	@echo "    make create-pair        Create MTS token pair (needs injectived)"
	@echo "    make verify             Check ERC20 metadata + cross-VM balances"
	@echo ""

# ---------------------------------------------------------------------------
# Build & Test
# ---------------------------------------------------------------------------

build:
	forge build

test:
	FOUNDRY_OFFLINE=true forge test

# ---------------------------------------------------------------------------
# Deploy on Sepolia
# ---------------------------------------------------------------------------

deploy-sepolia:
	@test -n "$(PRIVATE_KEY)" || (echo "Set PRIVATE_KEY in .env" && exit 1)
	forge script script/DeployACME.s.sol \
		--rpc-url "$(SEPOLIA_RPC_URL)" \
		--private-key "$(PRIVATE_KEY)" \
		--broadcast

# Check ACME balance on Sepolia
check-balance:
	@test -n "$(ACME_ADDRESS)" || (echo "Set ACME_ADDRESS in .env" && exit 1)
	@test -n "$(WALLET_ADDRESS)" || (echo "Set WALLET_ADDRESS in .env" && exit 1)
	@echo "ACME balance on Sepolia:"
	@cast call "$(ACME_ADDRESS)" "balanceOf(address)(uint256)" "$(WALLET_ADDRESS)" --rpc-url "$(SEPOLIA_RPC_URL)"

# ---------------------------------------------------------------------------
# Bridge to Injective
# ---------------------------------------------------------------------------

bridge:
	@chmod +x scripts/bridge.sh
	@./scripts/bridge.sh

# Check balance on Injective (Cosmos side)
check-injective:
	@test -n "$(INJ_ADDRESS)" || (echo "Set INJ_ADDRESS in .env" && exit 1)
	@echo "Balances on Injective testnet:"
	@curl -s "https://testnet.sentry.lcd.injective.network:443/cosmos/bank/v1beta1/balances/$(INJ_ADDRESS)" | jq '.balances'

# ---------------------------------------------------------------------------
# Create MTS Token Pair
# ---------------------------------------------------------------------------

create-pair:
	@chmod +x scripts/create-pair.sh
	@./scripts/create-pair.sh

# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------

verify:
	@chmod +x scripts/verify-token.sh
	@./scripts/verify-token.sh
