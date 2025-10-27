const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Read deployed address from scripts/MotorbikeNFT-address.txt if present
  const addrPath = path.join(__dirname, 'MotorbikeNFT-address.txt');
  let address;
  if (fs.existsSync(addrPath)) {
    address = fs.readFileSync(addrPath, 'utf8').trim();
  } else {
    console.error('Cannot find deployed address file at', addrPath);
    process.exit(1);
  }

  console.log('Using contract address:', address);

  const [deployer] = await ethers.getSigners();
  console.log('Minting from account:', deployer.address);

  const contract = await ethers.getContractAt('MotorbikeNFT', address);

  // Sample motorbike data
  const to = deployer.address;
  const vin = 'TESTVIN123456789';
  const engineNumber = 'ENG123456';
  const model = 'Air Blade Test';
  const color = 'Đỏ';
  const year = 2025;

  const tx = await contract.mint(to, vin, engineNumber, model, color, year);
  console.log('Sent mint tx:', tx.hash);
  const receipt = await tx.wait();
  console.log('Mint mined in block', receipt.blockNumber);
  console.log('Receipt logs:', receipt.logs.length);
}

main().catch(err => { console.error(err); process.exit(1); });
