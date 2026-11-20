-include .env
export

# Defaults — override via .env or shell
RPC_URL          ?= https://k8s.testnet.json-rpc.injective.network/
VERIFIER_URL     ?= https://testnet.blockscout-api.injective.network/api/
GAS_PRICE        ?= 160000000
GAS_LIMIT        ?= 2000000
LOCAL_RPC        := http://localhost:8545
DEPLOY_SCRIPT    := script/Deploy.s.sol

.PHONY: help build test

help:
	@echo ""
	@echo "  Build & Test"
	@echo "    make build                Compile template Solidity contracts with Foundry"
	@echo "    make test                 Run test suite (in-memory EVM)"
	@echo ""
	@echo "  Local Devnet (Injective node + Blockscout explorer)"
	@echo "    make local-init           Pull the published node image and initialize the chain"
	@echo "    make local-start          Start node and explorer"
	@echo "    make local-stop           Stop all local services"
	@echo "    make local-clean          Remove chain data and explorer DB"
	@echo "    make local-deploy         Deploy contracts via forge script"
	@echo ""
	@echo "  Testnet"
	@echo "    make testnet-deploy       Deploy contracts via forge script"
	@echo "    make testnet-verify       Verify contract on Blockscout"
	@echo ""

# ---------------------------------------------------------------------------
# Build & Test
# ---------------------------------------------------------------------------

build:
	forge build

test:
	FOUNDRY_OFFLINE=true forge test

# ---------------------------------------------------------------------------
# Local Devnet
# ---------------------------------------------------------------------------

local-init:
	@cd local-dev && ./setup.sh

local-start:
	@cd local-dev && docker compose up -d --wait
	@echo "Node ready at $(LOCAL_RPC)"
	@echo "Explorer: http://localhost:3000"

local-stop:
	@cd local-dev && docker compose down

local-clean:
	@cd local-dev && docker compose down -v
	@rm -rf local-dev/data
	@echo "Chain data and explorer DB removed. Run 'make local-init' to reinitialize."

local-deploy:
	@test -n "$(PRIVATE_KEY)" || (echo "Set PRIVATE_KEY in .env" && exit 1)
	forge script $(DEPLOY_SCRIPT) \
		--rpc-url "$(LOCAL_RPC)" \
		--private-key "$(PRIVATE_KEY)" \
		--legacy \
		--gas-price "$(GAS_PRICE)" \
		--broadcast

# ---------------------------------------------------------------------------
# Testnet
# ---------------------------------------------------------------------------

testnet-deploy:
	@test -n "$(PRIVATE_KEY)" || (echo "Set PRIVATE_KEY in .env" && exit 1)
	forge script $(DEPLOY_SCRIPT) \
		--rpc-url "$(RPC_URL)" \
		--private-key "$(PRIVATE_KEY)" \
		--legacy \
		--gas-price "$(GAS_PRICE)" \
		--broadcast

testnet-verify:
	@test -n "$(CONTRACT_ADDRESS)" || (echo "Set CONTRACT_ADDRESS in .env" && exit 1)
	forge verify-contract \
		--rpc-url "$(RPC_URL)" \
		--verifier blockscout \
		--verifier-url "$(VERIFIER_URL)" \
		"$(CONTRACT_ADDRESS)" \
		src/Counter.sol:Counter
