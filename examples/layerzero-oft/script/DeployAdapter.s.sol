// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import { InjectiveOFTAdapter } from "../src/InjectiveOFTAdapter.sol";

/// Path A: lock and unlock adapter around an existing MTS token.
/// MTS_ERC20_ADDRESS is the erc20_address returned by the token pair query.
contract DeployAdapter is Script {
    function run() external {
        address token = vm.envAddress("MTS_ERC20_ADDRESS");
        address endpoint = vm.envAddress("LZ_ENDPOINT");
        address delegate = vm.envAddress("WALLET_ADDRESS");

        vm.broadcast();
        InjectiveOFTAdapter adapter = new InjectiveOFTAdapter(token, endpoint, delegate);

        console.log("InjectiveOFTAdapter deployed at:", address(adapter));
        console.log("Set OAPP_ADDRESS in .env to this address.");
    }
}
