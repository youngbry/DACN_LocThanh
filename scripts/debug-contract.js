const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Đọc contract address
  const contractAddress = fs.readFileSync("./scripts/MotorbikeNFT-address.txt", "utf8").trim();
  
  // Get accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("=== THÔNG TIN HỆ THỐNG ===");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer (Should be admin):", deployer.address);
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);
  
  try {
    // Get contract instance  
    const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
    const contract = MotorbikeNFT.attach(contractAddress);
    
    console.log("\n=== KIỂM TRA CONTRACT ===");
    
    // Check contract code
    const provider = ethers.provider;
    const code = await provider.getCode(contractAddress);
    console.log("Contract có code?", code !== "0x");
    
    if (code !== "0x") {
      // Try to get owner
      try {
        const owner = await contract.owner();
        console.log("Contract Owner:", owner);
        console.log("Deployer là owner?", owner.toLowerCase() === deployer.address.toLowerCase());
        
        // Try to get totalSupply
        const totalSupply = await contract.totalSupply();
        console.log("Total Supply:", totalSupply.toString());
        
      } catch (error) {
        console.error("Lỗi gọi contract functions:", error.message);
      }
    } else {
      console.log("❌ Contract chưa được deploy!");
    }
    
  } catch (error) {
    console.error("Lỗi tổng quát:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});