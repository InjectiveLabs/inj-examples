// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title InjectiveOFTAdapter
/// @notice Lock and unlock adapter around an existing MTS token on Injective EVM.
contract InjectiveOFTAdapter is OFTAdapter {
    constructor(
        address token,
        address lzEndpoint,
        address delegate
    ) OFTAdapter(token, lzEndpoint, delegate) Ownable(delegate) {}
}
