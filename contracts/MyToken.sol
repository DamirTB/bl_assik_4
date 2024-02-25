// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC721, Ownable {
    constructor(address initialOwner)
        ERC721("MyToken", "MTK")
        Ownable(initialOwner)
    {}
    function baseURI() external pure returns (string memory) {
        return "https://bafkreiccsbdpwgmwz4yvsll7tn724bfv2xevwyvbcb5jkqykx3d24fjdqm.ipfs.nftstorage.link/";
    }
    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }
}