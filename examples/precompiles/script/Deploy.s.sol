// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

/// @notice Deploy standard EVM contracts (no precompile calls).
/// Works with forge script's simulation.
///
/// Contracts that call Injective precompiles (e.g. InjectiveToken) cannot be
/// deployed with forge script because Foundry's EVM doesn't have precompiles.
/// Use `forge create` instead:
///
///   forge create src/InjectiveToken.sol:InjectiveToken \
///     --rpc-url http://localhost:8545 \
///     --private-key $PRIVATE_KEY \
///     --legacy --gas-price 160000000 --gas-limit 2000000 \
///     --value 1ether --broadcast
///
/// Or use the Makefile targets: `make local-deploy-token` / `make testnet-deploy-token`
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        Counter counter = new Counter();
        console.log("Counter:", address(counter));

        // Add standard EVM contracts here.
        // Precompile contracts must use `forge create`, see comment above.

        vm.stopBroadcast();
    }
}