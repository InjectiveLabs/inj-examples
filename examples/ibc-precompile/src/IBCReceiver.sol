// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Records a transfer received through Injective's inbound EVM hook.
contract IBCReceiver {
    address private constant IBC_SYSTEM = 0x0000000000000000000000000000000000000069;

    event Received(string channel, string packetSender, address token, uint256 amount, address receiver, bytes payload);

    function onIBCTransfer(
        string calldata destChannelId,
        string calldata packetSender,
        address token,
        uint256 amount,
        address receiver,
        bytes calldata payload
    ) external returns (bytes memory) {
        require(msg.sender == IBC_SYSTEM, "unauthorized IBC caller");

        // An empty payload exercises the error acknowledgement and refund path.
        require(payload.length > 0, "empty payload");
        emit Received(destChannelId, packetSender, token, amount, receiver, payload);
        return abi.encode(true);
    }
}
