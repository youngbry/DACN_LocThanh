// Restore on-chain state from backup-state.json
// 1. Deploy fresh contracts
// 2. Mint tokens to recorded owners (final state only)
// 3. Re-create listings (approve + list)
// Usage: npx hardhat run scripts/restore-state.js --network localhost
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const backupFile = path.join(__dirname, "backup-state.json");
  if (!fs.existsSync(backupFile)) {
    throw new Error("backup-state.json not found. Run backup-state.js first.");
  }
  const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));
  console.log("🔁 Restoring from backup timestamp:", backup.timestamp);

  // Deploy fresh NFT
  const MotorbikeNFT = await ethers.getContractFactory("MotorbikeNFT");
  const nft = await MotorbikeNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ New NFT deployed:", nftAddress);

  // Deploy fresh Marketplace
  const MotorbikeMarketplace = await ethers.getContractFactory(
    "MotorbikeMarketplace"
  );
  const market = await MotorbikeMarketplace.deploy(nftAddress);
  await market.waitForDeployment();
  const marketplaceAddress = await market.getAddress();
  console.log("✅ New Marketplace deployed:", marketplaceAddress);

  // Write addresses (overwrite old ones)
  fs.writeFileSync(
    path.join(__dirname, "MotorbikeNFT-address.txt"),
    nftAddress
  );
  fs.writeFileSync(
    path.join(__dirname, "MotorbikeMarketplace-address.txt"),
    marketplaceAddress
  );

  // Update frontend ABI/address files similar to deploy-and-update-web.js
  try {
    const nftAbi = JSON.parse(MotorbikeNFT.interface.formatJson());
    const marketAbi = JSON.parse(MotorbikeMarketplace.interface.formatJson());
    const webPath = path.join(__dirname, "..", "web", "src", "blockchain");
    fs.mkdirSync(webPath, { recursive: true });
    fs.writeFileSync(
      path.join(webPath, "MotorbikeNFT.js"),
      `export const CONTRACT_ADDRESS = "${nftAddress}";\nexport const ABI = ${JSON.stringify(
        nftAbi,
        null,
        2
      )};\n`
    );
    fs.writeFileSync(
      path.join(webPath, "MotorbikeMarketplace.js"),
      `export const MARKETPLACE_ADDRESS = "${marketplaceAddress}";\nexport const MARKETPLACE_ABI = ${JSON.stringify(
        marketAbi,
        null,
        2
      )};\n`
    );
    console.log("📝 Frontend contract files updated.");
  } catch (e) {
    console.log("⚠️  Failed updating frontend files:", e.message);
  }

  // Mint tokens (final owner only; history not replayed)
  const [admin, ...others] = await ethers.getSigners();
  console.log("👤 Admin:", admin.address);

  for (const t of backup.tokens) {
    // Mint to final owner (admin has permission)
    try {
      const tx = await nft.mint(
        t.owner,
        t.vin,
        t.engineNumber,
        t.model,
        t.color,
        t.year
      );
      await tx.wait();
      // Optionally re-lock if needed
      if (t.locked) {
        await nft.setTokenLock(
          (await nft.nextTokenId()) - 1n,
          true,
          "RESTORED_LOCK"
        );
      }
      process.stdout.write(`✅ Minted tokenId ${t.tokenId}\n`);
    } catch (e) {
      console.log(`❌ Mint failed token ${t.tokenId}:`, e.message);
    }
  }

  // Re-create listings
  for (const l of backup.listings) {
    try {
      // Find signer matching seller
      const signer = [...others, admin].find(
        (s) => s.address.toLowerCase() === l.seller.toLowerCase()
      );
      if (!signer) {
        console.log(
          `⚠️  Skipping listing token ${l.tokenId}: seller not found`
        );
        continue;
      }
      const nftWithSigner = nft.connect(signer);
      // Set approval if needed
      const isApproved = await nft.getApproved(l.tokenId).catch(() => null);
      if (
        !isApproved ||
        isApproved.toLowerCase() !== marketplaceAddress.toLowerCase()
      ) {
        const approveTx = await nftWithSigner.approve(
          marketplaceAddress,
          l.tokenId
        );
        await approveTx.wait();
      }
      const marketWithSigner = market.connect(signer);
      const listTx = await marketWithSigner.listNFT(l.tokenId, l.price);
      await listTx.wait();
      console.log(`🛍️  Restored listing token ${l.tokenId} price ${l.price}`);
    } catch (e) {
      console.log(`❌ Listing restore failed token ${l.tokenId}:`, e.message);
    }
  }

  console.log("🎉 Restore completed.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
