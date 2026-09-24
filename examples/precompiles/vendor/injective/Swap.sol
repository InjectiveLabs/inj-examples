// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Native spot-swap precompile, live since v1.20.4 (Meridian).
/// Swaps execute against Injective's on-chain orderbook via the exchange
/// module, on the caller's default subaccount, and revert on failure.
/// Markets must be allowlisted in SwapParams (governed by
/// MsgUpdateSwapParams); calls against a non-allowlisted market revert
/// with "market <id> is not allowlisted for swaps: invalid swap route".
ISwapModule constant SWAP_CONTRACT = ISwapModule(0x0000000000000000000000000000000000000068);

interface ISwapModule {
    /// @dev Quote how much `amountOut` an exact `amountIn` of `tokenIn`
    /// would currently receive on `marketId`. Read-only, no state change.
    /// @param tokenIn ERC20 address of the input token (backed by the bank module under MTS)
    /// @param marketId spot market id (0x-prefixed hex string)
    /// @param amountIn input amount in the token's ERC20 decimals
    function quoteExactInputV1(
        address tokenIn,
        string calldata marketId,
        uint256 amountIn
    ) external view returns (uint256 amountOut);

    /// @dev Quote how much `amountIn` is required to receive an exact
    /// `amountOut` of `tokenOut` on `marketId`. Read-only.
    function quoteExactOutputV1(
        address tokenOut,
        string calldata marketId,
        uint256 amountOut
    ) external view returns (uint256 amountIn);

    /// @dev Swap an exact `amountIn` of `tokenIn` on `marketId`. Reverts
    /// if the output would be below `minOut` or `deadline` (unix seconds)
    /// has passed. Executes on the caller's default subaccount; the caller
    /// must hold `amountIn` of `tokenIn`.
    /// @return amountOut the amount credited to `recipient`
    function swapExactInputV1(
        address tokenIn,
        string calldata marketId,
        uint256 amountIn,
        uint256 minOut,
        address recipient,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
