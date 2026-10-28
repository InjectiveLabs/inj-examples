-include .env
export

RPC_URL  ?= https://k8s.testnet.json-rpc.injective.network/
LCD_URL  ?= https://testnet.sentry.lcd.injective.network:443
TM_URL   ?= https://testnet.sentry.tm.injective.network:443
CHAIN_ID ?= injective-888

.PHONY: help build create-native-token deploy-adapter deploy-oft set-peer verify

help:
	@echo ""
	@echo "  Build"
	@echo "    make build                Compile InjectiveOFT and InjectiveOFTAdapter"
	@echo ""
	@echo "  Path A: native first (tokenfactory token, then an adapter)"
	@echo "    make create-native-token  One native tx: create denom + mint + create token pair"
	@echo "    make deploy-adapter       Deploy InjectiveOFTAdapter around MTS_ERC20_ADDRESS"
	@echo ""
	@echo "  Path B: EVM first (the OFT contract is the token)"
	@echo "    make deploy-oft           Deploy InjectiveOFT funded with DEPLOY_VALUE"
	@echo ""
	@echo "  Bridging"
	@echo "    make set-peer             Point OAPP_ADDRESS at SOLANA_OFT_STORE (or use lz:oapp:wire)"
	@echo "    make verify               Compare bank supply, EVM supply and balances"
	@echo ""

build:
	forge build

create-native-token:
	@chmod +x scripts/create-native-token.sh
	@./scripts/create-native-token.sh

deploy-adapter:
	@test -n "$(PRIVATE_KEY)" || (echo "Set PRIVATE_KEY in .env" && exit 1)
	@test -n "$(MTS_ERC20_ADDRESS)" || (echo "Set MTS_ERC20_ADDRESS in .env (run make create-native-token first)" && exit 1)
	forge script script/DeployAdapter.s.sol \
		--rpc-url "$(RPC_URL)" \
		--private-key "$(PRIVATE_KEY)" \
		--broadcast

deploy-oft:
	@test -n "$(PRIVATE_KEY)" || (echo "Set PRIVATE_KEY in .env" && exit 1)
	forge script script/DeployOFT.s.sol \
		--rpc-url "$(RPC_URL)" \
		--private-key "$(PRIVATE_KEY)" \
		--broadcast

set-peer:
	@chmod +x scripts/set-peer.sh
	@./scripts/set-peer.sh

verify:
	@chmod +x scripts/verify.sh
	@./scripts/verify.sh
