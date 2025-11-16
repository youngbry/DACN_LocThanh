// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMotorbikeNFT {
    function locked(uint256 tokenId) external view returns (bool);
}

contract MotorbikeMarketplace is Ownable, ReentrancyGuard {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }

    struct PriceChange {
        uint256 oldPrice;
        uint256 newPrice;
        uint256 timestamp;
    }

    IERC721 public nftContract;
    
    // Mapping from tokenId to listing
    mapping(uint256 => Listing) public listings;

    // Price history per tokenId (chronological)
    mapping(uint256 => PriceChange[]) public priceHistory;
    
    // Array of all listed token IDs
    uint256[] public listedTokens;
    
    // Mapping to check if token is already listed
    mapping(uint256 => bool) public isListed;
    
    // Events
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

    constructor(address _nftContract) Ownable(msg.sender) {
        nftContract = IERC721(_nftContract);
    }

    // List NFT for sale
    function listNFT(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        require(nftContract.getApproved(tokenId) == address(this) || 
                nftContract.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved to transfer NFT");
        require(price > 0, "Price must be greater than 0");
        require(!isListed[tokenId], "NFT already listed");
        require(!IMotorbikeNFT(address(nftContract)).locked(tokenId), "Token locked");

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });

        // Only add to listedTokens array if not already present
        if (!_isTokenInArray(tokenId)) {
            listedTokens.push(tokenId);
        }
        isListed[tokenId] = true;

        emit NFTListed(tokenId, msg.sender, price);
    }

    // Helper function to check if token is already in array
    function _isTokenInArray(uint256 tokenId) private view returns (bool) {
        for (uint256 i = 0; i < listedTokens.length; i++) {
            if (listedTokens[i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    // Update listing price
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        require(isListed[tokenId], "NFT not listed");
        require(listings[tokenId].seller == msg.sender, "You're not the seller");
        require(listings[tokenId].isActive, "Listing not active");
        require(newPrice > 0, "Price must be greater than 0");

        uint256 oldPrice = listings[tokenId].price;
        listings[tokenId].price = newPrice;

        // Record history
        priceHistory[tokenId].push(PriceChange({
            oldPrice: oldPrice,
            newPrice: newPrice,
            timestamp: block.timestamp
        }));

        emit PriceUpdated(tokenId, oldPrice, newPrice);
    }

    // Buy NFT
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        require(isListed[tokenId], "NFT not listed");
        require(listings[tokenId].isActive, "Listing not active");
        require(msg.value >= listings[tokenId].price, "Insufficient payment");
        require(msg.sender != listings[tokenId].seller, "Cannot buy your own NFT");
        require(!IMotorbikeNFT(address(nftContract)).locked(tokenId), "Token locked");

        Listing memory listing = listings[tokenId];
        
        // Mark as sold
        listings[tokenId].isActive = false;
        isListed[tokenId] = false;

        // Transfer NFT
        nftContract.transferFrom(listing.seller, msg.sender, tokenId);

        // Transfer payment
        payable(listing.seller).transfer(msg.value);

        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    // Unlist NFT
    function unlistNFT(uint256 tokenId) external {
        require(isListed[tokenId], "NFT not listed");
        require(listings[tokenId].seller == msg.sender, "You're not the seller");
        require(listings[tokenId].isActive, "Listing not active");
        require(!IMotorbikeNFT(address(nftContract)).locked(tokenId), "Token locked");

        listings[tokenId].isActive = false;
        isListed[tokenId] = false;

        emit NFTUnlisted(tokenId, msg.sender);
    }

    // Get all active listings
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 0; i < listedTokens.length; i++) {
            if (listings[listedTokens[i]].isActive && 
                nftContract.ownerOf(listedTokens[i]) == listings[listedTokens[i]].seller) {
                activeCount++;
            }
        }

        // Create array of active listings
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < listedTokens.length; i++) {
            uint256 tokenId = listedTokens[i];
            if (listings[tokenId].isActive && 
                nftContract.ownerOf(tokenId) == listings[tokenId].seller) {
                activeListings[index] = listings[tokenId];
                index++;
            }
        }

        return activeListings;
    }

    // Get listing by token ID
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        require(isListed[tokenId], "NFT not listed");
        return listings[tokenId];
    }

    // Get listings by seller
    function getListingsBySeller(address seller) external view returns (Listing[] memory) {
        uint256 sellerCount = 0;

        // Count seller's listings
        for (uint256 i = 0; i < listedTokens.length; i++) {
            if (listings[listedTokens[i]].seller == seller && 
                listings[listedTokens[i]].isActive) {
                sellerCount++;
            }
        }

        // Create array of seller's listings
        Listing[] memory sellerListings = new Listing[](sellerCount);
        uint256 index = 0;

        for (uint256 i = 0; i < listedTokens.length; i++) {
            uint256 tokenId = listedTokens[i];
            if (listings[tokenId].seller == seller && listings[tokenId].isActive) {
                sellerListings[index] = listings[tokenId];
                index++;
            }
        }

        return sellerListings;
    }

    // Check if NFT is listed for sale
    function isNFTListed(uint256 tokenId) external view returns (bool) {
        return isListed[tokenId] && listings[tokenId].isActive;
    }

    // Get total number of active listings
    function getActiveListingCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < listedTokens.length; i++) {
            if (listings[listedTokens[i]].isActive && 
                nftContract.ownerOf(listedTokens[i]) == listings[listedTokens[i]].seller) {
                count++;
            }
        }
        return count;
    }

    // Get full price history for a tokenId
    function getPriceHistory(uint256 tokenId) external view returns (PriceChange[] memory) {
        return priceHistory[tokenId];
    }
}