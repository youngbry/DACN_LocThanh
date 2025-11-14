const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Đọc contract address
  const contractAddress = fs
    .readFileSync("./scripts/MotorbikeNFT-address.txt", "utf8")
    .trim();

  // Get contract instance
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const contract = MotorbikeNFT.attach(contractAddress);

  // Get accounts
  const [deployer, user1, user2] = await ethers.getSigners();

  console.log("=== THÔNG TIN TÀI KHOẢN ===");
  console.log("Deployer (Admin):", deployer.address);
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);

  console.log("\n=== KIỂM TRA QUYỀN ADMIN ===");

  // Kiểm tra owner của contract
  try {
    const owner = await contract.owner();
    console.log("Contract Owner:", owner);
    console.log(
      "Deployer là admin?",
      owner.toLowerCase() === deployer.address.toLowerCase()
    );
    console.log(
      "User1 là admin?",
      owner.toLowerCase() === user1.address.toLowerCase()
    );
  } catch (error) {
    console.error("Lỗi kiểm tra owner:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
