// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/ACME.sol";

contract ACMETest is Test {
    ACME token;
    address deployer = address(this);

    function setUp() public {
        token = new ACME();
    }

    function test_name() public view {
        assertEq(token.name(), "ACME Token");
    }

    function test_symbol() public view {
        assertEq(token.symbol(), "ACME");
    }

    function test_decimals() public view {
        assertEq(token.decimals(), 18);
    }

    function test_initialSupply() public view {
        assertEq(token.totalSupply(), 1_000_000 * 10 ** 18);
        assertEq(token.balanceOf(deployer), 1_000_000 * 10 ** 18);
    }

    function test_transfer() public {
        address recipient = address(0xBEEF);
        uint256 amount = 100 * 10 ** 18;
        token.transfer(recipient, amount);
        assertEq(token.balanceOf(recipient), amount);
        assertEq(token.balanceOf(deployer), 1_000_000 * 10 ** 18 - amount);
    }
}
