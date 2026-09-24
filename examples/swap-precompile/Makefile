-include .env
export

# Defaults — override via .env or shell
RPC_URL      ?= https://k8s.testnet.json-rpc.injective.network/
SWAP         := 0x0000000000000000000000000000000000000068
# Testnet USDT (MTS bank-backed ERC20) and the INJ/USDT spot market
TOKEN_IN     ?= 0xaDC7bcB5d8fe053Ef19b4E0C861c262Af6e0db60
MARKET_ID    ?= 0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe
AMOUNT_IN    ?= 10000000
MIN_OUT      ?= 0
RECIPIENT    ?= $(shell cast wallet address --private-key $(PRIVATE_KEY) 2>/dev/null)
DEADLINE     := $(shell echo $$(( $$(date +%s) + 120 )))

.PHONY: help build quote quote-out swap deploy demo-swap

help:
	@echo ""
	@echo "  make build      compile contracts"
	@echo "  make quote      read-only quote via the precompile (cast call)"
	@echo "  make quote-out  exact-output quote"
	@echo "  make swap       execute swapExactInputV1 from your EOA (cast send)"
	@echo "  make deploy     deploy SwapDemo (on-chain composition example)"
	@echo "  make demo-swap  swap through a deployed SwapDemo (set DEMO_ADDR)"
	@echo ""
	@echo "  Precompile calls only work against a real Injective node - forge's"
	@echo "  local simulation has no 0x68, so scripts/tests that call it revert."
	@echo ""

build:
	forge build

quote:
	cast call $(SWAP) "quoteExactInputV1(address,string,uint256)(uint256)" \
	  $(TOKEN_IN) "$(MARKET_ID)" $(AMOUNT_IN) --rpc-url $(RPC_URL)

quote-out:
	cast call $(SWAP) "quoteExactOutputV1(address,string,uint256)(uint256)" \
	  $(TOKEN_IN) "$(MARKET_ID)" $(AMOUNT_IN) --rpc-url $(RPC_URL)

swap:
	cast send $(SWAP) "swapExactInputV1(address,string,uint256,uint256,address,uint256)(uint256)" \
	  $(TOKEN_IN) "$(MARKET_ID)" $(AMOUNT_IN) $(MIN_OUT) $(RECIPIENT) $(DEADLINE) \
	  --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)

deploy:
	forge create src/SwapDemo.sol:SwapDemo --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast

demo-swap:
	cast send $(DEMO_ADDR) "swapWithSlippage(address,string,uint256,uint256,uint256,address)(uint256)" \
	  $(TOKEN_IN) "$(MARKET_ID)" $(AMOUNT_IN) 100 120 $(RECIPIENT) \
	  --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)
