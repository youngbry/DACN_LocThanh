// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MotorbikeNFT is ERC721, Ownable {
    struct Motorbike {
        string vin; // Số khung
        string engineNumber; // Số máy
        string model;
        string color;
        uint256 year;
    }

    mapping(uint256 => Motorbike) public motorbikes;
    uint256 public nextTokenId;

    constructor() ERC721("MotorbikeNFT", "MBNFT") Ownable(msg.sender) {}

    function mint(
        address to,
        string memory vin,
        string memory engineNumber,
        string memory model,
        string memory color,
        uint256 year
    ) public onlyOwner {
        motorbikes[nextTokenId] = Motorbike(vin, engineNumber, model, color, year);
        _safeMint(to, nextTokenId);
        nextTokenId++;
    }

    function getMotorbike(uint256 tokenId) public view returns (Motorbike memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return motorbikes[tokenId];
    }
}
