// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IStake {
    function stake(uint rawAmount) external returns (uint);

    function unstake(uint rawShares) external returns (uint);

    function balanceOf(address account) external view returns (uint256);

    function totalShares() external view returns (uint);

    function estimatedTDropOwnedBy(
        address account
    ) external view returns (uint);

    function lastRewardMintHeight() external view returns (uint256);

    function stakingRewardPerBlock() external view returns (uint256);
}
