// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MintBurnBankERC20} from "@injective/MintBurnBankERC20.sol";

/// @title InjectiveToken - ERC-20 backed by the Injective Bank precompile
/// @notice This token exists as both a standard ERC-20 and a native Cosmos denom.
///         Balances are unified across EVM and Core — no bridging needed.
/// @dev    Inherits MintBurnBankERC20 from InjectiveLabs/solidity-contracts.
///         The Bank precompile at 0x64 handles all mint/burn/transfer operations
///         through the native x/bank module.
///
///         This contract will NOT work in `forge test` (Foundry's EVM doesn't have
///         precompiles). Test against a local injectived node: `make local-deploy-token`
contract InjectiveToken is MintBurnBankERC20 {
    constructor()
        payable
        MintBurnBankERC20(
            msg.sender,     // owner — can mint and burn
            "Injective Token",
            "INJT",
            18
        )
    {}
}
