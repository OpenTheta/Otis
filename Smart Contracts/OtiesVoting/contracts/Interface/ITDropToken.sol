// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ITDROPTOKEN {
    function transfer(
        address from,
        address to,
        uint256 amount
    ) external view returns (uint256);

    function approve(address account, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);
}
