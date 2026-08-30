// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
 
import { Test } from "forge-std/Test.sol";
import { Counter } from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;
 
    function setUp() public {
        counter = new Counter();
    }
 
    function test_InitialValue() public view {
        assertEq(counter.value(), 0);
    }
 
    function test_IncrementValueFromZero() public {
        counter.increment(100);
        assertEq(counter.value(), 100);
    }
 
    function test_IncrementValueFromNonZero() public {
        counter.increment(100);
        counter.increment(23);
        assertEq(counter.value(), 123);
    }
}
