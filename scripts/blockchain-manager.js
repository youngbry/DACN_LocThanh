const fs = require('fs');
const path = require('path');

// Backup current blockchain state
function backup() {
  const backupDir = './blockchain-backup';
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  // Save current contract address and ABI
  const webFile = path.join(__dirname, '..', 'web', 'src', 'blockchain', 'MotorbikeNFT.js');
  if (fs.existsSync(webFile)) {
    fs.copyFileSync(webFile, path.join(backupDir, 'MotorbikeNFT.js.backup'));
    console.log('✅ Backed up contract configuration');
  }
  
  // Save deployment info
  const deployInfo = {
    timestamp: new Date().toISOString(),
    network: 'localhost',
    note: 'Backup before server restart'
  };
  
  fs.writeFileSync(
    path.join(backupDir, 'deployment-info.json'), 
    JSON.stringify(deployInfo, null, 2)
  );
  
  console.log('📦 Blockchain state backed up to:', backupDir);
}

// Restore and redeploy
async function restore() {
  const { ethers } = require("hardhat");
  
  console.log('🔄 Restoring blockchain state...');
  
  // Deploy contract
  console.log('📝 Deploying contract...');
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const contract = await MotorbikeNFT.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("✅ Contract deployed to:", address);
  
  // Update web app
  const abi = JSON.parse(MotorbikeNFT.interface.formatJson());
  const webPath = path.join(__dirname, '..', 'web', 'src', 'blockchain');
  const outFile = path.join(webPath, 'MotorbikeNFT.js');
  
  const content = `// This file is auto-generated
// Deploy address and ABI for the frontend (local Hardhat network)

export const CONTRACT_ADDRESS = "${address}";
export const ABI = ${JSON.stringify(abi, null, 2)};
`;
  
  fs.writeFileSync(outFile, content);
  console.log("✅ Web app updated");
  
  return { contract, address };
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'backup') {
    backup();
  } else if (command === 'restore') {
    await restore();
  } else {
    console.log('Usage:');
    console.log('  npx hardhat run scripts/blockchain-manager.js backup');
    console.log('  npx hardhat run scripts/blockchain-manager.js restore');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { backup, restore };