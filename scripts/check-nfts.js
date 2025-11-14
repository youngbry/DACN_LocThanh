const { ethers } = require("hardhat");

async function main() {
  // Contract address từ deploy
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get contract instance
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const contract = MotorbikeNFT.attach(contractAddress);

  try {
    // Get next token ID to know how many NFTs exist
    const nextTokenId = await contract.nextTokenId();
    console.log(`📊 Tổng số NFT đã tạo: ${nextTokenId.toString()}`);
    console.log("=" * 50);

    // Loop through all existing NFTs
    for (let i = 0; i < nextTokenId; i++) {
      try {
        const motorbike = await contract.getMotorbike(i);
        const owner = await contract.ownerOf(i);

        console.log(`🏍️  NFT #${i}`);
        console.log(`   VIN (Số khung): ${motorbike.vin}`);
        console.log(`   Số máy: ${motorbike.engineNumber}`);
        console.log(`   Model: ${motorbike.model}`);
        console.log(`   Màu sắc: ${motorbike.color}`);
        console.log(`   Năm sản xuất: ${motorbike.year.toString()}`);
        console.log(`   Chủ sở hữu: ${owner}`);
        console.log("─".repeat(50));
      } catch (e) {
        console.log(`❌ Không thể đọc NFT #${i}: ${e.message}`);
      }
    }

    if (nextTokenId == 0) {
      console.log("🔍 Chưa có NFT nào được tạo.");
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra NFT:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
