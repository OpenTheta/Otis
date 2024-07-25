// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TNT721Mock is ERC721, Ownable {
    constructor() ERC721("TNT721Mock", "TNFT") {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.tnt721mock.com/token/";
    }

    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        return string(abi.encodePacked(_baseURI(), Strings.toString(tokenId)));
    }
}
