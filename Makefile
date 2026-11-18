TEMPLATES := foundry hardhat react

.PHONY: list $(TEMPLATES)

list:
	@echo "Available templates:"
	@echo "  foundry  - Foundry EVM smart contract project"
	@echo "  hardhat  - Hardhat EVM smart contract project"
	@echo "  react    - React dApp with Injective smart contracts"
	@echo ""
	@echo "Usage:"
	@echo "  make foundry ~/my-project"
	@echo "  make hardhat ~/my-project"
	@echo "  make react ~/my-project"

$(TEMPLATES):
ifeq ($(word 2,$(MAKECMDGOALS)),)
	@echo "Error: path is required. Usage: make $@ <path-to-new-project>"
	@exit 1
endif
	@if [ -d "$(word 2,$(MAKECMDGOALS))" ]; then \
		echo "Error: directory '$(word 2,$(MAKECMDGOALS))' already exists"; \
		exit 1; \
	fi
	@echo "Creating project from $@ template at $(word 2,$(MAKECMDGOALS))..."
	@mkdir -p "$(word 2,$(MAKECMDGOALS))"
	@cp -r "templates/$@/." "$(word 2,$(MAKECMDGOALS))/"
	@if [ "$@" = foundry ]; then \
		mkdir -p "$(word 2,$(MAKECMDGOALS))/vendor/injective" && \
		cp examples/precompiles/vendor/injective/Swap.sol \
			examples/precompiles/vendor/injective/IBC.sol \
			"$(word 2,$(MAKECMDGOALS))/vendor/injective/"; \
	fi
	@git -C "$(word 2,$(MAKECMDGOALS))" init -b main
	@echo ""
	@echo "Done! Your project is ready at $(word 2,$(MAKECMDGOALS))"

%:
	@:
