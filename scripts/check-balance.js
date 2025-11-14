const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("🔍 Checking account...");
  console.log("Address:", signer.address);

  const balance = await signer.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const network = await signer.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
}

main().catch(console.error);
