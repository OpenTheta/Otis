// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface ILockTNT20Interface {
    function claimPendingReward(uint amount) external;

    function rewardAmount() external returns (uint);

    function getUserVotes(address userAddress, uint256 pTime) external view returns (uint);
}
