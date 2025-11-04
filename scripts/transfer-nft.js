const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    // Đọc địa chỉ contract
    const addressFile = path.join(__dirname, 'MotorbikeNFT-address.txt');
    const contractAddress = fs.readFileSync(addressFile, 'utf8').trim();
    
    // Lấy accounts từ Hardhat
    const accounts = await hre.ethers.getSigners();
    
    console.log(`📍 Using contract address: ${contractAddress}`);
    console.log(`👤 Owner address: ${accounts[0].address}`);
    console.log(`🎯 Transfer to: ${accounts[1].address}`);
    
    // Kết nối với contract
    const MotorbikeNFT = await hre.ethers.getContractFactory("MotorbikeNFT");
    const contract = MotorbikeNFT.attach(contractAddress);
    
    // Transfer NFT #0 từ accounts[0] đến accounts[1]
    const tokenId = 0;
    
    console.log(`🔄 Transferring NFT #${tokenId}...`);
    const tx = await contract.transferFrom(accounts[0].address, accounts[1].address, tokenId);
    
    console.log(`⏳ Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    // Kiểm tra owner mới
    const newOwner = await contract.ownerOf(tokenId);
    console.log(`🏍️ NFT #${tokenId} now owned by: ${newOwner}`);
    
    // Chuyển tiếp NFT #0 từ accounts[1] đến accounts[2]  
    console.log(`\n🔄 Transferring NFT #${tokenId} to third owner...`);
    const contract2 = contract.connect(accounts[1]); // Kết nối với accounts[1]
    const tx2 = await contract2.transferFrom(accounts[1].address, accounts[2].address, tokenId);
    
    console.log(`⏳ Transaction hash: ${tx2.hash}`);
    const receipt2 = await tx2.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt2.blockNumber}`);
    
    const finalOwner = await contract.ownerOf(tokenId);
    console.log(`🏍️ NFT #${tokenId} final owner: ${finalOwner}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });