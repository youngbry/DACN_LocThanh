// Backup on-chain state (NFT metadata + active listings) to JSON
// Usage: npx hardhat run scripts/backup-state.js --network localhost
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const outFile = path.join(__dirname, "backup-state.json");

  // Read deployed addresses (created by deploy-and-update-web.js)
  const nftAddressFile = path.join(__dirname, "MotorbikeNFT-address.txt");
  const marketplaceAddressFile = path.join(
    __dirname,
    "MotorbikeMarketplace-address.txt"
  );

  if (
    !fs.existsSync(nftAddressFile) ||
    !fs.existsSync(marketplaceAddressFile)
  ) {
    throw new Error(
      "Missing address files. Run deploy-and-update-web.js first."
    );
  }

  const nftAddress = fs.readFileSync(nftAddressFile, "utf8").trim();
  const marketplaceAddress = fs
    .readFileSync(marketplaceAddressFile, "utf8")
    .trim();

  console.log("🔗 NFT:", nftAddress);
  console.log("🔗 Marketplace:", marketplaceAddress);

  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const nft = MotorbikeNFT.attach(nftAddress);
  const MotorbikeMarketplace = await ethers.getContractFactory(
    "MotorbikeMarketplace"
  );
  const market = MotorbikeMarketplace.attach(marketplaceAddress);

  // Backup NFTs
  const nextTokenId = await nft.nextTokenId();
  const total = Number(nextTokenId);
  console.log("📊 Total tokens:", total);

  const tokens = [];
  for (let i = 0; i < total; i++) {
    try {
      const mb = await nft.getMotorbike(i);
      const owner = await nft.ownerOf(i);
      const locked = await nft.locked(i);
      tokens.push({
        tokenId: i,
        vin: mb.vin,
        engineNumber: mb.engineNumber,
        model: mb.model,
        color: mb.color,
        year: Number(mb.year),
        owner,
        locked,
      });
    } catch (e) {
      console.log(`⚠️  Skip token ${i}: ${e.message}`);
    }
  }

  // Backup active listings
  let listings = [];
  try {
    const active = await market.getActiveListings();
    listings = active.map((l) => ({
      tokenId: Number(l.tokenId),
      seller: l.seller,
      price: l.price.toString(),
      listedAt: Number(l.listedAt),
    }));
  } catch (e) {
    console.log("⚠️  Cannot fetch listings:", e.message);
  }

  const backup = {
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    nftAddress,
    marketplaceAddress,
    tokens,
    listings,
  };

  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2));
  console.log("💾 State saved to", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
