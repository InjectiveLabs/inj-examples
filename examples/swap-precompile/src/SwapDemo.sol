// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SWAP_CONTRACT} from "./ISwapModule.sol";

/// @title SwapDemo
/// @notice Minimal quote-then-swap pattern against the native swap
/// precompile (0x68): fetch a live quote, derive minOut from a slippage
/// tolerance, execute in the same transaction.
/// @dev The precompile executes on the CALLER's default subaccount, so
/// when this contract is the caller, this contract must hold the input
/// tokens. EOAs can also call the precompile directly (see the Makefile
/// cast targets) without this contract.
contract SwapDemo {
    uint256 public constant BPS = 10_000;

    /// @notice v1.21 quote reporting input consumption before output.
    function quoteV2(address tokenIn, string calldata marketId, uint256 amountIn)
        external view returns (uint256 amountInSpent, uint256 amountOut)
    {
        return SWAP_CONTRACT.quoteExactInputV2(tokenIn, marketId, amountIn);
    }

    /// @notice Execute within explicit output and unspent-input bounds.
    /// @dev This demo spends its own funds. Production contracts must authorize
    /// callers. Choose maxUnspent for the market tick and application's policy.
    function swapV2(
        address tokenIn,
        string calldata marketId,
        uint256 amountIn,
        uint256 minOut,
        uint256 maxUnspent,
        address recipient,
        uint256 deadline
    ) external returns (uint256 amountInSpent, uint256 amountOut) {
        require(minOut > 0, "zero minimum output");
        (amountInSpent, amountOut) = SWAP_CONTRACT.swapExactInputV2(
            tokenIn, marketId, amountIn, minOut, recipient, deadline
        );
        require(amountInSpent <= amountIn, "invalid spent amount");
        require(amountIn - amountInSpent <= maxUnspent, "partial fill");
    }

    /// @notice Receive at least amountOut, spending at most maxAmountIn.
    function swapForOutput(
        address tokenOut,
        string calldata marketId,
        uint256 amountOut,
        uint256 maxAmountIn,
        address recipient,
        uint256 deadline
    ) external returns (uint256 amountInSpent, uint256 amountOutDelivered) {
        return SWAP_CONTRACT.swapExactOutputV1(
            tokenOut, marketId, amountOut, maxAmountIn, recipient, deadline
        );
    }

    /// @notice Read-only passthrough quote.
    function quote(
        address tokenIn,
        string calldata marketId,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        return SWAP_CONTRACT.quoteExactInputV1(tokenIn, marketId, amountIn);
    }

    /// @notice Quote, derive minOut from `slippageBps`, and swap.
    /// @param slippageBps tolerated slippage vs the quote, in basis points
    /// @param deadlineSeconds seconds from now until the swap expires
    function swapWithSlippage(
        address tokenIn,
        string calldata marketId,
        uint256 amountIn,
        uint256 slippageBps,
        uint256 deadlineSeconds,
        address recipient
    ) external returns (uint256 amountOut) {
        require(slippageBps < BPS, "slippage >= 100%");
        uint256 quoted = SWAP_CONTRACT.quoteExactInputV1(tokenIn, marketId, amountIn);
        uint256 minOut = (quoted * (BPS - slippageBps)) / BPS;
        amountOut = SWAP_CONTRACT.swapExactInputV1(
            tokenIn,
            marketId,
            amountIn,
            minOut,
            recipient,
            block.timestamp + deadlineSeconds
        );
    }
}
