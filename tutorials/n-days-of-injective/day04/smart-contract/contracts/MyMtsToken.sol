// SPDX-License-Identifier: MIT
// Ref: https://github.com/InjectiveLabs/solidity-contracts/blob/b152129a/src/FixedSupplyBankERC20.sol (modified from)
pragma solidity ^0.8.20;

import "./BankERC20.sol";

/// @title My MultiVM Token Standard (MTS) Token
/// @notice A token with a fixed supply that implements the MTS standard,
/// via the Injective Bank module's EVM precompile.
/// @dev Ref: https://docs.injective.network/developers-evm/bank-precompile
/// @dev Ref: https://docs.injective.network/developers-evm/multivm-token-standard
contract MyMtsToken is BankERC20 {
    /// @notice Constructor for MyMtsToken token.
    /// - Fixed total supply, for which minimum is 1 full unit (see decimal places).
    /// - All units are allocated to the deployer account.
    /// - Decimal places is 18.
    /// @param name_ Token name
    /// @param symbol_ Token symbol
    /// @param supply_ Token total fixed supply
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 supply_
    ) payable BankERC20(name_, symbol_, 18) {
        require(supply_ >= 10 ** 18, "under minimum supply");
        _mint(msg.sender, supply_);
    }
}
