// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/ACME.sol";

contract DeployACME is Script {
    function run() external {
        vm.broadcast();
        ACME token = new ACME();
        console.log("ACME deployed at:", address(token));
    }
}
