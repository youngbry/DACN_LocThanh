const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const contract = await MotorbikeNFT.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MotorbikeNFT deployed to:", address);

  // Lưu địa chỉ và ABI ra file để dùng cho web app
  const abi = MotorbikeNFT.interface.formatJson();
  fs.writeFileSync("./scripts/MotorbikeNFT-abi.json", abi);
  fs.writeFileSync("./scripts/MotorbikeNFT-address.txt", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
