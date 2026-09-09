// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ACME Token
/// @notice A simple ERC-20 token for demonstrating the Peggy bridge + MTS flow.
///         Deploy on Ethereum (Sepolia), bridge to Injective via Peggy,
///         then create an MTS token pair for EVM visibility on Injective.
contract ACME is ERC20 {
    uint8 private immutable _decimals;

    constructor() ERC20("ACME Token", "ACME") {
        _decimals = 18;
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
