// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity =0.8.19;

contract MockParam  {
    function stakingRewardPerBlock() public pure returns (uint) {
        return uint(1000000000000000000);
    }
}