const { ethers } = require("hardhat");

async function main() {
  // Đọc contract address từ web app file
  const fs = require("fs");
  const path = require("path");

  const webFile = path.join(
    __dirname,
    "..",
    "web",
    "src",
    "blockchain",
    "MotorbikeNFT.js"
  );
  const content = fs.readFileSync(webFile, "utf8");
  const addressMatch = content.match(/CONTRACT_ADDRESS = "([^"]+)"/);

  if (!addressMatch) {
    throw new Error("Could not find contract address");
  }

  const contractAddress = addressMatch[1];
  console.log("📍 Using contract address:", contractAddress);

  // Get contract instance
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const contract = MotorbikeNFT.attach(contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("👤 Signer address:", signer.address);

  // Mint NFT
  console.log("🏍️ Minting NFT...");
  const tx = await contract.mint(
    signer.address,
    "RLHPC4508M7123456",
    "PC45E7123456",
    "Honda Winner X 150",
    "Đen nhám",
    2023
  );

  console.log("⏳ Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  console.log("📋 Logs count:", receipt.logs.length);

  // Check total NFTs
  const nextTokenId = await contract.nextTokenId();
  console.log("📊 Total NFTs now:", nextTokenId.toString());

  // Read the NFT we just minted
  if (nextTokenId > 0) {
    const tokenId = nextTokenId - 1n; // Last minted token
    const motorbike = await contract.getMotorbike(tokenId);
    const owner = await contract.ownerOf(tokenId);

    console.log(`\n🏍️ NFT #${tokenId} Details:`);
    console.log("   VIN:", motorbike.vin);
    console.log("   Engine:", motorbike.engineNumber);
    console.log("   Model:", motorbike.model);
    console.log("   Color:", motorbike.color);
    console.log("   Year:", motorbike.year.toString());
    console.log("   Owner:", owner);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
