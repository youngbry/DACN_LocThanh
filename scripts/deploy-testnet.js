const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log(`🚀 Deploying to ${networkName} network...`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("❌ Insufficient balance! Please fund your account first.");
  }

  // Deploy contract
  console.log("📝 Deploying MotorbikeNFT contract...");
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");

  // Deploy with gas estimation
  const estimatedGas = await MotorbikeNFT.getDeployTransaction().estimateGas();
  console.log("⛽ Estimated gas:", estimatedGas.toString());

  const contract = await MotorbikeNFT.deploy();
  console.log("⏳ Transaction hash:", contract.deploymentTransaction().hash);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ Contract deployed to:", address);
  console.log("🔗 Block explorer:");

  // Show block explorer links
  switch (networkName) {
    case "sepolia":
      console.log(`   https://sepolia.etherscan.io/address/${address}`);
      break;
    case "mumbai":
      console.log(`   https://mumbai.polygonscan.com/address/${address}`);
      break;
    case "bscTestnet":
      console.log(`   https://testnet.bscscan.com/address/${address}`);
      break;
  }

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    contractAddress: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockExplorerUrl: getBlockExplorerUrl(networkName, address),
    transactionHash: contract.deploymentTransaction().hash,
  };

  // Save to file
  const deployDir = "./deployments";
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir);
  }

  fs.writeFileSync(
    `${deployDir}/${networkName}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Update web app for testnet
  const abi = JSON.parse(MotorbikeNFT.interface.formatJson());
  updateWebApp(address, abi, networkName);

  console.log("💾 Deployment info saved to deployments/");
  console.log("🌐 Web app updated for", networkName);

  return { contract, address, deploymentInfo };
}

function getBlockExplorerUrl(network, address) {
  const explorers = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    mumbai: `https://mumbai.polygonscan.com/address/${address}`,
    bscTestnet: `https://testnet.bscscan.com/address/${address}`,
  };
  return explorers[network] || "";
}

function updateWebApp(contractAddress, abi, network) {
  const webPath = path.join(__dirname, "..", "web", "src", "blockchain");

  try {
    fs.mkdirSync(webPath, { recursive: true });
  } catch (e) {}

  const networkConfig = {
    sepolia: {
      rpcUrl:
        "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY,
      chainId: 11155111,
      name: "Sepolia Testnet",
    },
    mumbai: {
      rpcUrl: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      name: "Mumbai Testnet",
    },
    bscTestnet: {
      rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      name: "BSC Testnet",
    },
  };

  const config = networkConfig[network] || {
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    name: "Localhost",
  };

  const content = `// Auto-generated deployment configuration
// Network: ${config.name}
// Deployed: ${new Date().toISOString()}

export const CONTRACT_ADDRESS = "${contractAddress}";
export const NETWORK_CONFIG = ${JSON.stringify(config, null, 2)};
export const ABI = ${JSON.stringify(abi, null, 2)};
`;

  const outFile = path.join(webPath, "MotorbikeNFT.js");
  fs.writeFileSync(outFile, content);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
