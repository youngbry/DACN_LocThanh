const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Địa chỉ ví admin mới
  const newAdminAddress = "0x82D1135440b8a2c65ff8635d204cfd444824D3F4";
  
  // Đọc contract address
  const contractAddress = fs.readFileSync("./scripts/MotorbikeNFT-address.txt", "utf8").trim();
  
  // Get contract instance
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const contract = MotorbikeNFT.attach(contractAddress);
  
  console.log("=== CHUYỂN QUYỀN ADMIN ===");
  console.log("Contract:", contractAddress);
  console.log("Admin mới:", newAdminAddress);
  
  try {
    // Chuyển ownership cho ví của bạn
    const tx = await contract.transferOwnership(newAdminAddress);
    await tx.wait();
    
    console.log("✅ Đã chuyển quyền admin thành công!");
    console.log("📋 Transaction hash:", tx.hash);
    
    // Kiểm tra lại
    const newOwner = await contract.owner();
    console.log("🔍 Owner mới:", newOwner);
    
  } catch (error) {
    console.error("❌ Lỗi chuyển quyền:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});