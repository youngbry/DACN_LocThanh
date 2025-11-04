const { ethers } = require("hardhat");

async function main() {
  // Get accounts từ hardhat
  const [deployer] = await ethers.getSigners();
  
  console.log("=== THÔNG TIN TÀI KHOẢN ADMIN ===");
  console.log("Address:", deployer.address);
  console.log("Private Key:", deployer.privateKey);
  
  console.log("\n=== HƯỚNG DẪN ===");
  console.log("1. Mở Rabby Wallet");
  console.log("2. Chọn 'Import Wallet'");  
  console.log("3. Paste private key này vào:");
  console.log("   " + deployer.privateKey);
  console.log("4. Sau đó connect ví này vào web app");
  console.log("5. Bây giờ bạn sẽ có quyền admin!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});