// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

/// @notice Deploy standard EVM contracts (no precompile calls).
/// Works with forge script's simulation.
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        Counter counter = new Counter();
        console.log("Counter:", address(counter));

        // Add more contracts here.

        vm.stopBroadcast();
    }
}