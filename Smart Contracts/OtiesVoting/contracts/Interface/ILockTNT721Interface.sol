// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface ILockTNT721Interface {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);

    function getUserVotes(address userAddress, uint256 pTime) external view returns (uint);
}
