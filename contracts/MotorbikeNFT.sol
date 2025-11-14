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
    // Uniqueness tracking for VIN and Engine Number
    mapping(bytes32 => bool) private _vinUsed;
    mapping(bytes32 => bool) private _engineUsed;
    
    // Optional: map to tokenId for lookups
    mapping(bytes32 => uint256) public vinToTokenId;
    mapping(bytes32 => uint256) public engineToTokenId;
    uint256 public nextTokenId;

    // Admin controls
    mapping(uint256 => bool) public locked;
    mapping(uint256 => string) public lockReason;

    event MotorbikeUpdated(uint256 indexed tokenId, string model, string color, uint256 year);
    event TokenLockSet(uint256 indexed tokenId, bool locked, string reason);

    constructor() ERC721("MotorbikeNFT", "MBNFT") Ownable(msg.sender) {}

    function mint(
        address to,
        string memory vin,
        string memory engineNumber,
        string memory model,
        string memory color,
        uint256 year
    ) public onlyOwner {
        bytes32 vinHash = keccak256(abi.encodePacked(vin));
        bytes32 engineHash = keccak256(abi.encodePacked(engineNumber));
        require(!_vinUsed[vinHash], "VIN already exists");
        require(!_engineUsed[engineHash], "Engine number already exists");

        motorbikes[nextTokenId] = Motorbike(vin, engineNumber, model, color, year);
        _safeMint(to, nextTokenId);
        _vinUsed[vinHash] = true;
        _engineUsed[engineHash] = true;
        vinToTokenId[vinHash] = nextTokenId;
        engineToTokenId[engineHash] = nextTokenId;
        nextTokenId++;
    }

    function getMotorbike(uint256 tokenId) public view returns (Motorbike memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return motorbikes[tokenId];
    }
    
    function totalSupply() public view returns (uint256) {
        return nextTokenId;
    }

    // Update mutable details (not identity: VIN/engine)
    function updateMotorbikeDetails(
        uint256 tokenId,
        string calldata model,
        string calldata color,
        uint256 year
    ) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Motorbike storage mb = motorbikes[tokenId];
        mb.model = model;
        mb.color = color;
        mb.year = year;
        emit MotorbikeUpdated(tokenId, model, color, year);
    }

    // Set lock to block transfers/listings off-chain
    function setTokenLock(uint256 tokenId, bool isLocked, string calldata reason) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        locked[tokenId] = isLocked;
        if (isLocked) {
            lockReason[tokenId] = reason;
        } else {
            lockReason[tokenId] = "";
        }
        emit TokenLockSet(tokenId, isLocked, reason);
    }

    // Helper views for frontends
    function isVinUsed(string memory vin) external view returns (bool) {
        return _vinUsed[keccak256(abi.encodePacked(vin))];
    }

    function isEngineNumberUsed(string memory engineNumber) external view returns (bool) {
        return _engineUsed[keccak256(abi.encodePacked(engineNumber))];
    }

    // Enforce lock on transfers (OZ v5 override)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        address fromAddr = _ownerOf(tokenId);
        if (fromAddr != address(0) && to != address(0)) {
            require(!locked[tokenId], "Token is locked");
        }
        return super._update(to, tokenId, auth);
    }
}
