// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title USDCVault
 * @dev USDC custodial vault on Injective EVM Testnet.
 *      Users deposit USDC and can withdraw their own funds at any time.
 *      No admin, no owner — fully permissionless.
 *
 * Injective EVM Testnet (Chain ID: 1439)
 *   USDC: 0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d
 *   RPC:  https://k8s.testnet.json-rpc.injective.network/
 *
 * Get testnet USDC: https://faucet.circle.com/
 * Docs: https://docs.injective.network/developers-defi/usdc-stablecoin
 */
contract USDCVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Official Circle USDC on Injective EVM Testnet
    address public constant USDC_ADDRESS = 0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d;

    IERC20 public immutable usdc;

    /// @notice Per-user deposited balance (in USDC units, 6 decimals)
    mapping(address => uint256) public deposits;

    /// @notice Total USDC currently held in the vault
    uint256 public totalDeposited;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);

    constructor() {
        usdc = IERC20(USDC_ADDRESS);
    }

    /**
     * @dev Deposit USDC into the vault.
     *      Caller must approve this contract first.
     * @param amount Amount in USDC units (6 decimals). 1 USDC = 1_000_000
     */
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalDeposited += amount;
        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Withdraw a specific amount of USDC from the vault.
     * @param amount Amount in USDC units (6 decimals)
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (deposits[msg.sender] < amount)
            revert InsufficientBalance(amount, deposits[msg.sender]);
        deposits[msg.sender] -= amount;
        totalDeposited -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Withdraw all of the caller's deposited USDC.
     */
    function withdrawAll() external nonReentrant {
        uint256 amount = deposits[msg.sender];
        if (amount == 0) revert ZeroAmount();
        deposits[msg.sender] = 0;
        totalDeposited -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Returns total USDC balance held by the vault (on-chain sanity check).
     */
    function getVaultBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @dev Returns the deposited balance for a given user.
     */
    function getUserDeposit(address user) external view returns (uint256) {
        return deposits[user];
    }
}
