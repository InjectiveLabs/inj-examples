// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import { InjectiveOFT } from "../src/InjectiveOFT.sol";

/// Path B: the OFT contract is the token. Balances live in the bank module under
/// the implicit denom `erc20:<contract address>`.
///
/// DEPLOY_VALUE funds the contract with INJ. The chain debits 1 INJ from the
/// contract's own balance when the first mint creates the denom, so an unfunded
/// contract fails its first inbound transfer with "failed to mint".
contract DeployOFT is Script {
    function run() external {
        string memory name_ = vm.envString("TOKEN_NAME");
        string memory symbol_ = vm.envString("TOKEN_SYMBOL");
        uint8 decimals_ = uint8(vm.envUint("TOKEN_DECIMALS"));
        address endpoint = vm.envAddress("LZ_ENDPOINT");
        address delegate = vm.envAddress("WALLET_ADDRESS");
        uint256 value = vm.envOr("DEPLOY_VALUE", uint256(1 ether));

        vm.broadcast();
        InjectiveOFT oft = new InjectiveOFT{ value: value }(name_, symbol_, decimals_, endpoint, delegate);

        console.log("InjectiveOFT deployed at:", address(oft));
        console.log("Bank denom: erc20:%s", vm.toString(address(oft)));
        console.log("Set OAPP_ADDRESS in .env to this address.");
    }
}
