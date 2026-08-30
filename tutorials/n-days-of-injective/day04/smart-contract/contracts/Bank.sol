// SPDX-License-Identifier: MIT
// Ref: https://github.com/InjectiveLabs/solidity-contracts/blob/b152129a/src/Bank.sol (exact copy)
pragma solidity ^0.8.20;

interface IBankModule {
    function mint(address, uint256) external payable returns (bool);

    function balanceOf(address, address) external view returns (uint256);

    function burn(address, uint256) external payable returns (bool);

    function transfer(
        address,
        address,
        uint256
    ) external payable returns (bool);

    function totalSupply(address) external view returns (uint256);

    function metadata(
        address
    ) external view returns (string memory, string memory, uint8);

    function setMetadata(
        string memory,
        string memory,
        uint8
    ) external payable returns (bool);
}
