// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@injectivelabs/solidity-contracts/src/oft-evm/BankOFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title InjectiveOFT
/// @notice A LayerZero OFT whose balances live in Injective's bank module.
///         `OFT` here is the BankERC20 backed variant from solidity-contracts
///         https://github.com/InjectiveLabs/solidity-contracts/blob/master/src/oft-evm/BankOFT.sol
///         not the stock LayerZero OFT.sol.
contract InjectiveOFT is OFT {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address lzEndpoint,
        address delegate
    ) payable OFT(name_, symbol_, decimals_, lzEndpoint, delegate) Ownable(delegate) {}

    /// @notice Mint on the home chain. Spoke deployments never call this.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @dev Accepts INJ so the contract can be topped up for the denom creation fee.
    receive() external payable {}
}
