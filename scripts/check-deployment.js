const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const nftAddressPath = path.join(__dirname, "MotorbikeNFT-address.txt");
  const marketAddressPath = path.join(
    __dirname,
    "MotorbikeMarketplace-address.txt"
  );

  if (!fs.existsSync(nftAddressPath) || !fs.existsSync(marketAddressPath)) {
    console.log("❌ Address files not found.");
    return;
  }

  const nftAddress = fs.readFileSync(nftAddressPath, "utf8").trim();
  const marketAddress = fs.readFileSync(marketAddressPath, "utf8").trim();

  console.log(`Checking NFT at: ${nftAddress}`);
  const nftCode = await hre.ethers.provider.getCode(nftAddress);
  if (nftCode === "0x") {
    console.log("❌ NFT Contract NOT found (code is 0x).");
  } else {
    console.log("✅ NFT Contract found.");
  }

  console.log(`Checking Marketplace at: ${marketAddress}`);
  const marketCode = await hre.ethers.provider.getCode(marketAddress);
  if (marketCode === "0x") {
    console.log("❌ Marketplace Contract NOT found (code is 0x).");
  } else {
    console.log("✅ Marketplace Contract found.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
