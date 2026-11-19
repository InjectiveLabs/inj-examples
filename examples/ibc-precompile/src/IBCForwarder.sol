// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IIBCModule} from "@injective/IBC.sol";

/// @notice Sends an ICS-20 packet using the contract's bank-backed balance.
contract IBCForwarder {
    IIBCModule private constant IBC = IIBCModule(0x0000000000000000000000000000000000000069);
    address private immutable OWNER = msg.sender;

    event PacketDispatched(string channel, uint64 sequence);

    receive() external payable {}

    function forward(string calldata channel, string calldata receiver, address token, uint256 amount)
        external
        returns (uint64 sequence)
    {
        require(msg.sender == OWNER, "unauthorized sender");

        IIBCModule.TimeoutHeight memory noHeight = IIBCModule.TimeoutHeight(0, 0);
        uint64 timeoutNs = uint64((block.timestamp + 10 minutes) * 1e9);
        sequence = IBC.transfer(channel, receiver, token, amount, noHeight, timeoutNs, "");
        emit PacketDispatched(channel, sequence);
    }
}
